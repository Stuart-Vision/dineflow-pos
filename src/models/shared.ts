import type { Schema } from 'mongoose';

/**
 * Common schema wiring shared by every model: timestamps, and a `toJSON`
 * transform that swaps `_id` for a string `id` and drops `__v` so API
 * responses never leak Mongoose internals to the client.
 *
 * Deliberately untyped (no `SchemaOptions<T>` annotation): Mongoose's
 * `SchemaOptions` generic binds tightly to one document shape, and a shared
 * object cannot satisfy every model's binding at once. Left inferred, the
 * object is structurally compatible with every `new Schema<T>(shape, options)`
 * call site.
 */
export const baseSchemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform(_doc: unknown, ret: Record<string, unknown>) {
      ret.id = String(ret._id);
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
  toObject: { virtuals: true },
};

/** Fields every soft-deletable document carries. */
export interface SoftDelete {
  deletedAt?: Date | null;
}

export const softDeleteFields = {
  deletedAt: { type: Date, default: null },
} as const;

/** Excludes soft-deleted documents unless a caller explicitly asks for them. */
export const NOT_DELETED = { deletedAt: null } as const;

export function applyNotDeleted(schema: Schema): void {
  const scopeToLive = function (this: { getQuery: () => Record<string, unknown> }) {
    const query = this.getQuery();
    if (!('deletedAt' in query)) {
      this.getQuery().deletedAt = null;
    }
  };
  schema.pre(/^find/, scopeToLive);
  schema.pre('countDocuments', scopeToLive);
}
