import RegimeBadge from '@/components/RegimeBadge';
import StatusBadge from '@/components/StatusBadge';
import { nextDeadline } from '@/logic/deadlines';
import { daysTillNextDeadline, formatDate } from '@/logic/tax-return';
import type { TaxReturn } from '@/types/clients';

import ChecklistItem from './ChecklistItem';

interface TaxReturnCardProps {
  clientId: string;
  taxReturn: TaxReturn;
}

export default function TaxReturnCard({ clientId, taxReturn }: TaxReturnCardProps) {
  const deadlineDate = nextDeadline(taxReturn);
  return (
    <>
      <div className="flex h-fit w-1/2 flex-col gap-4 rounded-md border-2 border-slate-200 bg-white p-4">
        <div className="flex">
          <div className="flex flex-1 gap-2">
            <RegimeBadge regime={taxReturn.regime} />
            <div className="text-sm font-semibold text-slate-400">{`${taxReturn.taxYear - 1} - ${taxReturn.taxYear}`}</div>
          </div>
          <StatusBadge status={taxReturn.status} />
        </div>
        {deadlineDate && (
          <div>
            <div className="text-md font-bold text-slate-900">Deadline</div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-slate-900">{formatDate(deadlineDate)}</div>
              <div className="text-sm font-semibold text-slate-400">{`${daysTillNextDeadline(deadlineDate)} days`}</div>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <div className="flex">
            <div className="text-md flex-1 font-bold text-slate-900">Documents</div>
            <div className="text-sm font-semibold text-slate-400">{`${taxReturn.checklist.filter((item) => item.done === true).length} of ${taxReturn.checklist.length}`}</div>
          </div>
          <div className="flex flex-col gap-2">
            {taxReturn.checklist.map((item) => {
              return <ChecklistItem key={item.id} clientId={clientId} item={item} />;
            })}
          </div>
        </div>
      </div>
    </>
  );
}
