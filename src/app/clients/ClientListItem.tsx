import { MTDTaxReturn, Regime, SA100TaxReturn, Status } from '@/types/clients';
import StatusBadge from '@/components/StatusBadge';
import Link from 'next/link';

interface ClientListItemProps {
  id: string;
  firstName: string;
  regime: Regime;
  taxReturns: MTDTaxReturn[] | SA100TaxReturn[];
}

export default function ClientListItem(props: ClientListItemProps) {
  const firstUnfiledReturn = props.taxReturns.find(
    (taxReturn) => taxReturn.status !== Status.filed,
  );
  const nextDeadline = firstUnfiledReturn
    ? firstUnfiledReturn.deadline.toLocaleDateString('en-GB')
    : 'n/a';
  const status = firstUnfiledReturn ? firstUnfiledReturn.status : Status.filed;

  return (
    <tr className="border-b border-slate-100 transition-colors hover:bg-slate-50">
      <td className="py-3 pr-5">
        <Link href={`/clients/${props.id}`} className="cursor-pointer">
          {props.firstName}
        </Link>
      </td>
      <td className="py-3 pr-5">{props.regime}</td>
      <td className="py-3 pr-5">{nextDeadline}</td>
      <td className="py-3 pr-5">
        <StatusBadge status={status} />
      </td>
    </tr>
  );
}
