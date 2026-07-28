import mongoose, { type Mongoose } from 'mongoose';

import { serverEnv } from '@/lib/env';

/**
 * Mongoose connection helper.
 *
 * Next.js hot-reloads modules in development, which would otherwise open a new
 * pool on every edit until Mongo refuses connections. The connection promise is
 * therefore cached on `globalThis` and reused.
 */

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

const globalForMongoose = globalThis as typeof globalThis & {
  __dineflowMongoose?: MongooseCache;
};

const cache: MongooseCache = globalForMongoose.__dineflowMongoose ?? {
  conn: null,
  promise: null,
};

globalForMongoose.__dineflowMongoose = cache;

// Reject writes containing keys the schema does not declare, rather than
// silently dropping them.
mongoose.set('strictQuery', true);

export async function connectToDatabase(uri?: string): Promise<Mongoose> {
  if (cache.conn && cache.conn.connection.readyState === 1) {
    return cache.conn;
  }

  if (!cache.promise) {
    const connectionString = uri ?? serverEnv().MONGODB_URI;

    cache.promise = mongoose
      .connect(connectionString, {
        bufferCommands: false,
        maxPoolSize: 20,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 10_000,
        socketTimeoutMS: 45_000,
        family: 4,
        autoIndex: process.env.NODE_ENV !== 'production',
      })
      .then(async (m) => {
        // Registering every model up front means a query never fails with
        // "Schema hasn't been registered" because of import ordering.
        await import('@/models');
        return m;
      });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}

export async function disconnectFromDatabase(): Promise<void> {
  if (cache.conn) {
    await cache.conn.disconnect();
    cache.conn = null;
    cache.promise = null;
  }
}

/**
 * True when the server is a replica set / mongos and therefore supports
 * multi-document transactions. A standalone `mongod` (a plain Atlas free-tier
 * shared cluster is fine; a bare local `mongod` is not) cannot start sessions,
 * so write flows fall back to sequential writes rather than crashing.
 */
export async function supportsTransactions(): Promise<boolean> {
  const conn = await connectToDatabase();
  const admin = conn.connection.db?.admin();
  if (!admin) return false;
  try {
    const info = (await admin.command({ hello: 1 })) as { setName?: string; msg?: string };
    return Boolean(info.setName || info.msg === 'isdbgrid');
  } catch {
    return false;
  }
}

/**
 * Run `fn` inside a transaction when the deployment supports one, and inline
 * otherwise. Keeps order/payment/inventory flows atomic in production without
 * making a standalone dev database unusable.
 */
export async function withTransaction<T>(
  fn: (session: mongoose.ClientSession | undefined) => Promise<T>,
): Promise<T> {
  const conn = await connectToDatabase();

  if (!(await supportsTransactions())) {
    return fn(undefined);
  }

  const session = await conn.startSession();
  try {
    let result: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result!;
  } finally {
    await session.endSession();
  }
}
