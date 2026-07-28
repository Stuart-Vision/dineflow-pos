'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ChefHat, Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useForm } from 'react-hook-form';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { DEMO_ACCOUNTS } from '@/constants/demo-accounts';
import { landingPathForRole } from '@/constants/roles';
import { ApiRequestError, apiPost } from '@/lib/api/client';
import { publicEnv } from '@/lib/env';
import { loginSchema, type LoginInput } from '@/validators/auth';

interface LoginResponse {
  user: { role: Parameters<typeof landingPathForRole>[0] };
}

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [pendingDemoEmail, setPendingDemoEmail] = React.useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const submit = React.useCallback(
    async (values: LoginInput) => {
      setServerError(null);
      try {
        const { user } = await apiPost<LoginResponse>('/api/auth/login', values);
        router.push(landingPathForRole(user.role));
        router.refresh();
      } catch (error) {
        setServerError(
          error instanceof ApiRequestError ? error.message : 'Something went wrong. Please try again.',
        );
      } finally {
        setPendingDemoEmail(null);
      }
    },
    [router],
  );

  const fillDemoAccount = React.useCallback(
    (email: string, password: string) => {
      setPendingDemoEmail(email);
      form.setValue('email', email);
      form.setValue('password', password);
      void form.handleSubmit(submit)();
    },
    [form, submit],
  );

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center lg:text-left">
        <div className="mb-2 flex items-center justify-center gap-2 lg:hidden">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ChefHat className="size-5" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">{publicEnv.appName}</span>
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to manage today&apos;s service.</p>
      </div>

      {serverError && (
        <Alert variant="destructive">
          <AlertTitle>Sign-in failed</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(submit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@restaurant.com"
                    invalid={Boolean(form.formState.errors.email)}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <a href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
                <FormControl>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    invalid={Boolean(form.formState.errors.password)}
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} id="rememberMe" />
                </FormControl>
                <FormLabel htmlFor="rememberMe" className="font-normal text-muted-foreground">
                  Keep me signed in for 30 days
                </FormLabel>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={form.formState.isSubmitting && !pendingDemoEmail}
            loadingText="Signing in…"
          >
            <LogIn className="size-4" />
            Sign in
          </Button>
        </form>
      </Form>

      {publicEnv.showDemoCredentials && (
        <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="size-4 text-primary" />
            Demo accounts — one click, no signup
          </div>
          <p className="text-xs text-muted-foreground">
            This is a portfolio demo. Pick a role to sign in instantly and explore its permissions.
          </p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => fillDemoAccount(account.email, account.password)}
                disabled={form.formState.isSubmitting}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-left text-xs transition-colors hover:border-primary/40 hover:bg-accent disabled:opacity-60"
              >
                <span>
                  <span className="block font-medium text-foreground">{account.label}</span>
                  <span className="text-muted-foreground">{account.email}</span>
                </span>
                {pendingDemoEmail === account.email && form.formState.isSubmitting && (
                  <span className="size-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
