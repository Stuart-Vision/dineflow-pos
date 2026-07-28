import { z } from 'zod';

/**
 * Auth form/API contracts. Shared between the client forms (React Hook Form
 * + zodResolver) and the route handlers, so a rule can never drift between
 * what the UI validates and what the server accepts.
 */

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address.');

export const passwordRulesSchema = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .regex(/[a-z]/, 'Include at least one lowercase letter.')
  .regex(/[A-Z]/, 'Include at least one uppercase letter.')
  .regex(/\d/, 'Include at least one number.');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.'),
  rememberMe: z.boolean().default(false),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    email: emailSchema,
    token: z.string().min(1, 'This reset link is invalid or has expired.'),
    password: passwordRulesSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
