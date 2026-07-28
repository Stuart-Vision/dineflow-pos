/**
 * Input sanitisation.
 *
 * Two distinct jobs, deliberately separate:
 *  - `sanitizeMongoInput` removes operator keys so a JSON body can never be
 *    reinterpreted as a query operator (`{"email": {"$ne": null}}`).
 *  - `stripHtml` / `escapeHtml` clean free-text that will be rendered.
 */

const MONGO_OPERATOR_PREFIX = '$';

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/**
 * Recursively drop keys beginning with `$` and keys containing a dot. Applied
 * to every parsed request body before it reaches a validator.
 */
export function sanitizeMongoInput<T>(input: T): T {
  return sanitizeValue(input as Json) as T;
}

function sanitizeValue(value: Json): Json {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value !== null && typeof value === 'object') {
    const result: { [key: string]: Json } = {};
    for (const [key, child] of Object.entries(value)) {
      if (key.startsWith(MONGO_OPERATOR_PREFIX) || key.includes('.')) continue;
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      result[key] = sanitizeValue(child as Json);
    }
    return result;
  }

  return value;
}

/** Remove all tags and decode nothing — for values stored as plain text. */
export function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escape a user-supplied string for safe use inside a RegExp. */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Normalise an email for storage and comparison. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Keep only digits and a single leading `+`. */
export function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}
