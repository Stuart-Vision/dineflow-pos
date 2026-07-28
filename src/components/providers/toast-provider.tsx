'use client';

import { useTheme } from 'next-themes';
import { Toaster } from 'sonner';

/**
 * Global toast outlet. Kept separate from ThemeProvider so it can read the
 * resolved theme and match the app surface rather than guessing.
 */
export function ToastProvider() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      duration={4000}
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      toastOptions={{
        classNames: {
          toast: 'font-sans rounded-lg border shadow-raised',
          title: 'font-medium',
          description: 'text-muted-foreground',
        },
      }}
    />
  );
}
