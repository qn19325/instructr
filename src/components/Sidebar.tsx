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
    <div className={`${className || ''} flex flex-col gap-4`}>
      <p className="text-sm font-bold">Tax Practice</p>
      <Link
        href={clientsPath}
        className={
          curPath.startsWith(clientsPath)
            ? 'font-semibold text-gray-900'
            : 'text-gray-500 hover:text-gray-700'
        }
      >
        Clients
      </Link>
      <Link
        href={calendarPath}
        className={
          curPath.startsWith(calendarPath)
            ? 'font-semibold text-gray-900'
            : 'text-gray-500 hover:text-gray-700'
        }
      >
        Calendar
      </Link>
    </div>
  );
}
