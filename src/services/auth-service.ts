import crypto from 'node:crypto';

import { AccountLockedError, AppError, ERROR_CODE, ForbiddenError, NotFoundError } from '@/lib/api/errors';
import { createSessionToken, type SessionUser } from '@/lib/auth/session';
import { resolveEffectivePermissions } from '@/lib/auth/permissions';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { serverEnv } from '@/lib/env';
import { sendMail } from '@/lib/notify/mail';
import { AuditLog } from '@/models/AuditLog';
import { User, USER_STATUS, type UserDocument } from '@/models/User';

const INVALID_CREDENTIALS_MESSAGE = 'The email or password you entered is incorrect.';
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

async function toSessionUser(user: UserDocument): Promise<SessionUser> {
  const permissions = await resolveEffectivePermissions(user);
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
    permissions,
    restaurantId: user.restaurantId ? String(user.restaurantId) : null,
    branchIds: user.branchIds.map(String),
    activeBranchId: user.activeBranchId ? String(user.activeBranchId) : null,
    avatarUrl: user.avatarUrl ?? null,
  };
}

export interface LoginResult {
  token: string;
  expiresAt: Date;
  ttlSeconds: number;
  sessionUser: SessionUser;
}

export async function login(
  email: string,
  password: string,
  rememberMe: boolean,
  ip: string,
): Promise<LoginResult> {
  const env = serverEnv();
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

  if (!user) {
    // Spend the same time as a real bcrypt compare so a missing account is
    // not distinguishable from a wrong password by response latency.
    await verifyPassword(password, '');
    throw new AppError(INVALID_CREDENTIALS_MESSAGE, { status: 401, code: ERROR_CODE.VALIDATION_ERROR });
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    throw new AccountLockedError(user.lockedUntil);
  }

  if (user.status === USER_STATUS.SUSPENDED) {
    throw new ForbiddenError('This account has been suspended. Contact your restaurant administrator.');
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);

  if (!passwordValid) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= env.AUTH_MAX_LOGIN_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + env.AUTH_LOCKOUT_MINUTES * 60_000);
    }
    await user.save();

    await AuditLog.create({
      restaurantId: user.restaurantId,
      userId: user._id,
      userName: user.name,
      action: 'login_failed',
      entityType: 'User',
      entityId: user._id,
      description: `Failed sign-in attempt for ${user.email}.`,
      metadata: { attempts: user.failedLoginAttempts },
      ipAddress: ip,
    });

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new AccountLockedError(user.lockedUntil);
    }
    throw new AppError(INVALID_CREDENTIALS_MESSAGE, { status: 401, code: ERROR_CODE.VALIDATION_ERROR });
  }

  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  user.lastLoginAt = new Date();
  user.lastLoginIp = ip;
  await user.save();

  const sessionUser = await toSessionUser(user);
  const ttlSeconds = rememberMe ? env.AUTH_REMEMBER_ME_TTL : env.AUTH_SESSION_TTL;
  const { token, expiresAt } = await createSessionToken(sessionUser, ttlSeconds);

  await AuditLog.create({
    restaurantId: user.restaurantId,
    userId: user._id,
    userName: user.name,
    action: 'login',
    entityType: 'User',
    entityId: user._id,
    description: `${user.name} signed in.`,
    metadata: { rememberMe },
    ipAddress: ip,
  });

  return { token, expiresAt, ttlSeconds, sessionUser };
}

export async function logout(user: SessionUser, ip: string): Promise<void> {
  await AuditLog.create({
    restaurantId: user.restaurantId,
    userId: user.id,
    userName: user.name,
    action: 'logout',
    entityType: 'User',
    entityId: user.id,
    description: `${user.name} signed out.`,
    metadata: {},
    ipAddress: ip,
  });
}

/**
 * Always resolves without revealing whether the email exists — the
 * response message and timing must not leak account existence.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return;

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetTokenHash = await hashPassword(rawToken);
  user.passwordResetExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await user.save();

  const resetUrl = `/reset-password?email=${encodeURIComponent(user.email)}&token=${rawToken}`;
  await sendMail({
    to: user.email,
    subject: 'Reset your DineFlow POS password',
    body: [
      `Hi ${user.name},`,
      '',
      'We received a request to reset your DineFlow POS password. This link expires in 1 hour:',
      resetUrl,
      '',
      "If you didn't request this, you can safely ignore this email.",
    ].join('\n'),
  });
}

export async function resetPassword(email: string, token: string, newPassword: string): Promise<void> {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+passwordResetTokenHash',
  );

  const invalidTokenError = new AppError('This reset link is invalid or has expired.', {
    status: 400,
    code: ERROR_CODE.VALIDATION_ERROR,
    fields: [{ field: 'token', message: 'Request a new reset link and try again.' }],
  });

  if (!user || !user.passwordResetTokenHash || !user.passwordResetExpiresAt) {
    throw invalidTokenError;
  }
  if (user.passwordResetExpiresAt.getTime() < Date.now()) {
    throw invalidTokenError;
  }

  const tokenValid = await verifyPassword(token, user.passwordResetTokenHash);
  if (!tokenValid) throw invalidTokenError;

  user.passwordHash = await hashPassword(newPassword);
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  user.mustChangePassword = false;
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  await user.save();

  await AuditLog.create({
    restaurantId: user.restaurantId,
    userId: user._id,
    userName: user.name,
    action: 'password_reset',
    entityType: 'User',
    entityId: user._id,
    description: `${user.name} reset their password.`,
    metadata: {},
    ipAddress: null,
  });
}

export async function getSessionUserById(userId: string): Promise<SessionUser> {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User');
  return toSessionUser(user);
}
