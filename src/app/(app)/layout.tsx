import { headers } from 'next/headers';

import DemoBanner from '@/components/DemoBanner';
import Sidebar from '@/components/Sidebar';
import { DEMO_HEADER } from '@/config/demo';

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDemo = (await headers()).get(DEMO_HEADER) === 'true';
  return (
    <>
      {isDemo && <DemoBanner />}
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-slate-50 p-8">{children}</main>
    </>
  );
}
