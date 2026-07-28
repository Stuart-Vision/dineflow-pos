/**
 * Application error taxonomy.
 *
 * Route handlers throw these; the central error handler in `handler.ts`
 * converts them into the standard error envelope. Nothing else formats an
 * error response, which is what keeps the API's error shape consistent.
 */

export const ERROR_CODE = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INVALID_TRANSITION: 'INVALID_TRANSITION',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  CSRF_FAILED: 'CSRF_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];

export interface FieldError {
  field: string;
  message: string;
}

export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly fields?: FieldError[];
  readonly details?: Record<string, unknown>;
  /** Set to false for expected, user-facing failures we do not want logged. */
  readonly shouldLog: boolean;

  constructor(
    message: string,
    options: {
      status?: number;
      code?: ErrorCode;
      fields?: FieldError[];
      details?: Record<string, unknown>;
      shouldLog?: boolean;
    } = {},
  ) {
    super(message);
    this.name = 'AppError';
    this.status = options.status ?? 400;
    this.code = options.code ?? ERROR_CODE.VALIDATION_ERROR;
    this.fields = options.fields;
    this.details = options.details;
    this.shouldLog = options.shouldLog ?? this.status >= 500;
    Error.captureStackTrace?.(this, AppError);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'The submitted data is invalid.', fields?: FieldError[]) {
    super(message, { status: 422, code: ERROR_CODE.VALIDATION_ERROR, fields });
    this.name = 'ValidationError';
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = 'You must sign in to continue.') {
    super(message, { status: 401, code: ERROR_CODE.UNAUTHENTICATED });
    this.name = 'UnauthenticatedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message, { status: 403, code: ERROR_CODE.FORBIDDEN });
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} was not found.`, { status: 404, code: ERROR_CODE.NOT_FOUND });
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'This action conflicts with the current state.', details?: Record<string, unknown>) {
    super(message, { status: 409, code: ERROR_CODE.CONFLICT, details });
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number, message = 'Too many requests. Please slow down.') {
    super(message, { status: 429, code: ERROR_CODE.RATE_LIMITED });
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class InvalidTransitionError extends AppError {
  constructor(from: string, to: string, entity = 'Order') {
    super(`${entity} cannot move from "${from}" to "${to}".`, {
      status: 409,
      code: ERROR_CODE.INVALID_TRANSITION,
      details: { from, to },
    });
    this.name = 'InvalidTransitionError';
  }
}

export class InsufficientStockError extends AppError {
  constructor(items: Array<{ name: string; required: number; available: number; unit: string }>) {
    super('There is not enough stock to complete this order.', {
      status: 409,
      code: ERROR_CODE.INSUFFICIENT_STOCK,
      details: { items },
    });
    this.name = 'InsufficientStockError';
  }
}

export class PaymentError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, { status: 402, code: ERROR_CODE.PAYMENT_ERROR, details });
    this.name = 'PaymentError';
  }
}

export class AccountLockedError extends AppError {
  constructor(unlockAt: Date) {
    const minutes = Math.max(1, Math.ceil((unlockAt.getTime() - Date.now()) / 60_000));
    super(`Too many failed sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`, {
      status: 423,
      code: ERROR_CODE.ACCOUNT_LOCKED,
      details: { unlockAt: unlockAt.toISOString() },
    });
    this.name = 'AccountLockedError';
  }
}

export class CsrfError extends AppError {
  constructor() {
    super('Your session token could not be verified. Please refresh and try again.', {
      status: 403,
      code: ERROR_CODE.CSRF_FAILED,
    });
    this.name = 'CsrfError';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
