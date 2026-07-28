import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';

import { ThemeProvider } from '@/components/providers/theme-provider';
import { ToastProvider } from '@/components/providers/toast-provider';
import { publicEnv } from '@/lib/env';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.appUrl),
  title: {
    default: `${publicEnv.appName} — Restaurant Management System`,
    template: `%s · ${publicEnv.appName}`,
  },
  description:
    'DineFlow POS is a complete restaurant management and point-of-sale platform: fast counter service, a live kitchen display, table and reservation management, recipe-level inventory, and multi-branch reporting.',
  applicationName: publicEnv.appName,
  keywords: [
    'restaurant POS',
    'point of sale',
    'kitchen display system',
    'restaurant management',
    'inventory management',
    'table management',
  ],
  openGraph: {
    type: 'website',
    title: `${publicEnv.appName} — Restaurant Management System`,
    description:
      'Counter-fast POS, live kitchen display, recipe-level inventory and multi-branch reporting in one system.',
    siteName: publicEnv.appName,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0c2430' },
    { media: '(prefers-color-scheme: dark)', color: '#071822' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-dvh antialiased">
        <ThemeProvider>
          {children}
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
