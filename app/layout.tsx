/**
 * Root layout for the Stadium Companion AI application.
 * Sets up metadata, fonts, and the HTML structure.
 *
 * @module app/layout
 */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Stadium Companion AI | FIFA World Cup 2026',
  description:
    'Your AI-powered fan assistant for FIFA World Cup 2026 at MetLife Stadium. Get help with wayfinding, accessible routes, crowd status, transportation, and more.',
  keywords: [
    'FIFA World Cup 2026',
    'stadium assistant',
    'AI companion',
    'MetLife Stadium',
    'accessible routing',
    'fan experience',
  ],
  authors: [{ name: 'Stadium Companion AI Team' }],
  robots: 'index, follow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFBFE' },
    { media: '(prefers-color-scheme: dark)', color: '#0F0D1A' },
  ],
};

/**
 * Root layout component.
 * Provides the HTML shell with proper lang, fonts, and global styles.
 *
 * @param children - The page content
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
