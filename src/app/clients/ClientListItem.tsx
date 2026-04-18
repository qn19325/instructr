'use client';

import { useRouter } from 'next/navigation';
import { Client, Status } from '@/types/clients';

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
      <td className="inline-flex py-3 pr-5">
        <div
          className={`my-auto mr-1 h-3 w-3 rounded-lg ${taxReturns[0].status === Status.filed ? 'bg-green-500' : 'bg-red-500'}`}
        ></div>
        <div>{taxReturns[0].status}</div>
      </td>
    </tr>
  );
}
