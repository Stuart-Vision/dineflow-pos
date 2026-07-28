/**
 * Pure password-strength scoring, kept dependency-free (no bcrypt) so it can
 * be imported from client components — e.g. the reset-password form's
 * strength meter — without pulling server-only crypto into the browser
 * bundle.
 */
export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Very weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  suggestions: string[];
}

export function scorePassword(password: string): PasswordStrength {
  const suggestions: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else suggestions.push('Use at least 8 characters');

  if (password.length >= 12) score += 1;

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  else suggestions.push('Mix uppercase and lowercase letters');

  if (/\d/.test(password)) score += 1;
  else suggestions.push('Add a number');

  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else suggestions.push('Add a symbol');

  // Obvious sequences and repeats undo a length bonus.
  if (/(.)\1{2,}/.test(password) || /(?:abc|123|qwerty|password)/i.test(password)) {
    score = Math.max(0, score - 2);
    suggestions.push('Avoid repeated characters and common sequences');
  }

  const clamped = Math.min(4, Math.max(0, score)) as 0 | 1 | 2 | 3 | 4;
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'] as const;

  return { score: clamped, label: labels[clamped], suggestions };
}
