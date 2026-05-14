'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/clients', label: 'Clients' },
  { href: '/calendar', label: 'Calendar' },
];

export default function Sidebar() {
  const curPath = usePathname();

  return (
    <div className="flex w-56 flex-col gap-6 border-r border-slate-200 bg-white px-4 py-6">
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 rounded-full border-4 border-indigo-200 bg-indigo-600"></div>
        <div className="text-xl font-bold text-slate-900">Instructr</div>
      </div>
      <div className="flex flex-col">
        {navItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`rounded-md px-3 py-1 text-base ${
              curPath.startsWith(href)
                ? 'bg-slate-100 font-semibold text-slate-900'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
