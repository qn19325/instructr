import Sidebar from '@/components/Sidebar';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-slate-50 p-8">{children}</main>
    </>
  );
}
