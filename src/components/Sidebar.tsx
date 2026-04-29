'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { href: '/clients', label: 'Clients' },
  { href: '/calendar', label: 'Calendar' },
];

export default function Sidebar() {
  const curPath = usePathname();

  return (
    <div className="flex w-56 flex-col gap-6 border-r border-slate-200 bg-white px-4 py-6">
      <p className="text-xl font-semibold text-slate-900">Tax Practice</p>
      {navItems.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`rounded-md px-3 py-1 text-base ${
            curPath.startsWith(href)
              ? 'bg-indigo-50 font-medium text-indigo-700'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
