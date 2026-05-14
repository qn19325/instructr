import { Geist } from 'next/font/google';

import './globals.css';
import Sidebar from '@/components/Sidebar';

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
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">{children}</main>
      </body>
    </html>
  );
}
