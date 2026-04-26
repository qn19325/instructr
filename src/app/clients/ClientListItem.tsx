import { Client, Status } from '@/types/clients';
import StatusBadge from '@/components/StatusBadge';
import Link from 'next/link';

interface ClientListItemProps {
  client: Client;
}

export default function ClientListItem(props: ClientListItemProps) {
  const firstUnfiledReturn = props.client.taxReturns.find(
    (taxReturn) => taxReturn.status !== Status.filed,
  );

  let nextDeadline = '';

  if (firstUnfiledReturn) {
    if (firstUnfiledReturn.type === 'sa100') {
      nextDeadline = firstUnfiledReturn.deadline.toLocaleDateString('en-GB');
    } else {
      const firstUnfiledSubmission = firstUnfiledReturn.submissions.find(
        (submission) => submission.status !== Status.filed,
      );
      nextDeadline = firstUnfiledSubmission?.deadline.toLocaleDateString() ?? '';
    }
  }

  const status = firstUnfiledReturn ? firstUnfiledReturn.status : Status.filed;
  const regimeLabel =
    firstUnfiledReturn?.type === 'mtd'
      ? 'MTD'
      : firstUnfiledReturn?.type === 'sa100'
        ? 'SA100'
        : '';

  return (
    <tr className="border-b border-slate-100 transition-colors hover:bg-slate-50">
      <td className="py-3 pr-5">
        <Link href={`/clients/${props.client.id}`} className="cursor-pointer">
          {props.client.firstName}
        </Link>
      </td>
      <td className="py-3 pr-5">{regimeLabel}</td>
      <td className="py-3 pr-5">{nextDeadline}</td>
      <td className="py-3 pr-5">
        <StatusBadge status={status} />
      </td>
    </tr>
  );
}
