import { Client, Status, Regime } from '@/types/clients';
import StatusBadge from '@/components/StatusBadge';
import Link from 'next/link';
import { nextUnfiledReturn, nextDeadline } from '@/lib/clients';
import { formatDeadline } from '@/lib/deadlines';

interface ClientListItemProps {
  client: Client;
}

export default function ClientListItem(props: ClientListItemProps) {
  const firstUnfiledReturn = nextUnfiledReturn(props.client);
  const deadlineDate = firstUnfiledReturn ? nextDeadline(firstUnfiledReturn) : null;

  const status = firstUnfiledReturn ? firstUnfiledReturn.status : Status.filed;

  const mostRecentReturn = props.client.taxReturns.at(-1);
  const regimeLabel =
    mostRecentReturn?.type === Regime.mtd
      ? 'MTD'
      : mostRecentReturn?.type === Regime.sa100
        ? 'SA100'
        : '—';

  return (
    <tr className="border-b border-slate-100 transition-colors hover:bg-slate-50">
      <td className="py-3 pr-5">
        <Link href={`/clients/${props.client.id}`} className="cursor-pointer">
          {props.client.firstName} {props.client.lastName}
        </Link>
      </td>
      <td className="py-3 pr-5">{regimeLabel}</td>
      <td className="py-3 pr-5">{deadlineDate ? formatDeadline(deadlineDate) : ''}</td>
      <td className="py-3 pr-5">
        <StatusBadge status={status} />
      </td>
    </tr>
  );
}
