import bcrypt from 'bcryptjs';

import { serverEnv } from '@/lib/env';

/**
 * Password hashing.
 *
 * bcrypt with a per-hash salt and a configurable cost factor. `bcryptjs` is
 * used over the native binding so the Docker image needs no build toolchain.
 */

export async function hashPassword(plain: string): Promise<string> {
  const rounds = serverEnv().AUTH_BCRYPT_ROUNDS;
  return bcrypt.hash(plain, rounds);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash) {
    // Still spend the time so a missing hash is not distinguishable by timing.
    await bcrypt.compare(plain, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva');
    return false;
  }
  return bcrypt.compare(plain, hash);
}

export { scorePassword, type PasswordStrength } from './password-strength';
