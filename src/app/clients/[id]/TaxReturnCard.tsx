'use client';

import StatusBadge from '@/components/StatusBadge';
import { MTDTaxReturn, SA100TaxReturn } from '@/types/clients';
import { useState } from 'react';
import { formatDeadline } from '@/lib/deadlines';
import { nextDeadline } from '@/lib/clients';

export type TaxReturnCardProps = SA100TaxReturn | MTDTaxReturn;

export default function TaxReturnCard(props: TaxReturnCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const deadlineDate = nextDeadline(props);

  return (
    <>
      <tr
        className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50"
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <td className="py-3 pr-5">{deadlineDate ? formatDeadline(deadlineDate) : '—'}</td>
        <td className="py-3 pr-5">
          <StatusBadge status={props.status} />
        </td>
        <td className="py-3 pr-5">{props.taxYear}</td>
        <td className="py-3 pr-5">{props.type}</td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={4} className="pb-3">
            {props.checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-2 py-1 text-sm text-slate-600">
                <div
                  className={`h-3 w-3 rounded-full ${item.done ? 'bg-green-500' : 'bg-red-500'}`}
                ></div>
                <div>{item.text}</div>
              </div>
            ))}
          </td>
        </tr>
      )}
    </>
  );
}
