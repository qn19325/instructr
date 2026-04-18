'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const curPath = usePathname();
  const clientsPath = '/clients';
  const calendarPath = '/calendar';

  return (
    <div
      className={`${className || ''} flex w-56 flex-col gap-6 border-r border-slate-200 bg-white px-4 py-6`}
    >
      <p className="text-xl font-semibold text-slate-900">Tax Practice</p>
      <Link
        href={clientsPath}
        className={`px-3 py-1 text-base ${
          curPath.startsWith(clientsPath)
            ? 'font-semibold text-gray-900'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Clients
      </Link>
      <Link
        href={calendarPath}
        className={`px-3 py-1 text-base ${
          curPath.startsWith(calendarPath)
            ? 'font-semibold text-gray-900'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Calendar
      </Link>
    </div>
  );
}
