import { ClerkProvider } from '@clerk/nextjs';
import { Geist } from 'next/font/google';

import './globals.css';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Instructr',
  description: 'Accounting practice management',
};

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
        <body className="flex h-screen">{children}</body>
      </html>
    </ClerkProvider>
  );
}
