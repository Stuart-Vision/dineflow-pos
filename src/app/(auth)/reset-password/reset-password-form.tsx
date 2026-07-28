'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import * as React from 'react';
import { useForm } from 'react-hook-form';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ApiRequestError, apiPost } from '@/lib/api/client';
import { scorePassword } from '@/lib/auth/password-strength';
import { cn } from '@/lib/utils';
import { resetPasswordSchema, type ResetPasswordInput } from '@/validators/auth';

const STRENGTH_COLORS = ['bg-destructive', 'bg-destructive', 'bg-warning', 'bg-info', 'bg-success'];

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: searchParams.get('email') ?? '',
      token: searchParams.get('token') ?? '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = form.watch('password');
  const strength = scorePassword(password || '');

  async function onSubmit(values: ResetPasswordInput) {
    setServerError(null);
    try {
      await apiPost('/api/auth/reset-password', values);
      setDone(true);
    } catch (error) {
      setServerError(error instanceof ApiRequestError ? error.message : 'Something went wrong.');
    }
  }

  if (done) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/12 text-success">
          <CheckCircle2 className="size-6" />
        </div>
        <div className="space-y-1.5">
          <h1 className="font-display text-xl font-semibold tracking-tight">Password reset</h1>
          <p className="text-sm text-muted-foreground">You can now sign in with your new password.</p>
        </div>
        <Button asChild className="w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  if (!searchParams.get('token')) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Invalid reset link</AlertTitle>
        <AlertDescription>
          This link is missing its reset token. Request a new one from the{' '}
          <Link href="/forgot-password" className="font-medium underline">
            forgot password
          </Link>{' '}
          page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Set a new password</h1>
        <p className="text-sm text-muted-foreground">Choose something you don&apos;t use anywhere else.</p>
      </div>

      {serverError && (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t reset your password</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    endIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="pointer-events-auto"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    }
                    {...field}
                  />
                </FormControl>
                {field.value && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className={cn(
                            'h-1 flex-1 rounded-full bg-muted transition-colors',
                            i < strength.score && STRENGTH_COLORS[strength.score],
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{strength.label}</p>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm new password</FormLabel>
                <FormControl>
                  <Input type={showPassword ? 'text' : 'password'} autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" size="lg" className="w-full" loading={form.formState.isSubmitting}>
            Reset password
          </Button>
        </form>
      </Form>
    </div>
  );
}
