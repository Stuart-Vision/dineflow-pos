'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, MailCheck } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { useForm } from 'react-hook-form';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ApiRequestError, apiPost } from '@/lib/api/client';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/validators/auth';

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);
    try {
      await apiPost('/api/auth/forgot-password', values);
      setSubmitted(true);
    } catch (error) {
      setServerError(error instanceof ApiRequestError ? error.message : 'Something went wrong.');
    }
  }

  if (submitted) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/12 text-success">
          <MailCheck className="size-6" />
        </div>
        <div className="space-y-1.5">
          <h1 className="font-display text-xl font-semibold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{form.getValues('email')}</span>,
            a reset link is on its way. In this demo, the message is written to the server log instead of a real
            inbox.
          </p>
        </div>
        <Button variant="outline" asChild className="w-full">
          <Link href="/login">
            <ArrowLeft className="size-4" />
            Back to sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Forgot your password?</h1>
        <p className="text-sm text-muted-foreground">
          Enter the email on your account and we&apos;ll send you a reset link.
        </p>
      </div>

      {serverError && (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" placeholder="you@restaurant.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" size="lg" className="w-full" loading={form.formState.isSubmitting}>
            Send reset link
          </Button>
        </form>
      </Form>

      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to sign in
      </Link>
    </div>
  );
}
