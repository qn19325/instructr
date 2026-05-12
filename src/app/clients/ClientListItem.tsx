import { Client, Status } from '@/types/clients';
import StatusBadge from '@/components/StatusBadge';
import Link from 'next/link';
import {
  firstUnfiledReturn,
  formatDeadline,
  mostRecentReturn,
  regimeLabel,
} from '@/logic/tax-return';
import { nextDeadline } from '@/logic/deadlines';

interface ClientListItemProps {
  client: Client;
}

export default function ClientListItem(props: ClientListItemProps) {
  const unfiledReturn = firstUnfiledReturn(props.client.taxReturns);
  const deadlineDate = unfiledReturn ? nextDeadline(unfiledReturn) : null;
  const taxReturn = mostRecentReturn(props.client.taxReturns);
  const label = taxReturn ? regimeLabel(taxReturn) : '—';

  return (
    <tr className="border-b border-slate-100 transition-colors hover:bg-slate-50">
      <td className="py-3 pr-5">
        <Link href={`/clients/${props.client.id}`} className="cursor-pointer">
          {props.client.firstName} {props.client.lastName}
        </Link>
      </td>
      <td className="py-3 pr-5">{label}</td>
      <td className="py-3 pr-5">{deadlineDate ? formatDeadline(deadlineDate) : ''}</td>
      <td className="py-3 pr-5">
        <StatusBadge status={unfiledReturn ? unfiledReturn.status : Status.filed} />
      </td>
    </tr>
  );
}
