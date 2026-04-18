'use client';

import { useRouter } from 'next/navigation';
import { Client } from '@/types/clients';
import StatusBadge from '@/components/StatusBadge';

export default function ClientListItem({ id, name, regime, taxReturns }: Client) {
  const router = useRouter();

  return (
    <tr
      className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50"
      onClick={() => router.push(`/clients/${id}`)}
    >
      <td className="py-3 pr-5">{name}</td>
      <td className="py-3 pr-5">{regime}</td>
      <td className="py-3 pr-5">{taxReturns[0].deadline.toDateString()}</td>
      <td className="py-3 pr-5">
        <StatusBadge status={taxReturns[0].status} />
      </td>
    </tr>
  );
}
