'use client';

import StatusBadge from '@/components/StatusBadge';
import { MTDTaxReturn, SA100TaxReturn } from '@/types/clients';
import { useState } from 'react';

// TODO: remove this when we move to real data and update to internal models vs api models
export type TaxReturnCardProps =
  | (Omit<SA100TaxReturn, 'deadline'> & { deadline: string; name: string })
  | (Omit<MTDTaxReturn, 'deadline'> & { deadline: string; name: string });

export default function Card(props: TaxReturnCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <tr
        className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50"
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <td className="py-3 pr-5">{props.name}</td>
        <td className="py-3 pr-5">{props.deadline}</td>
        <td className="py-3 pr-5">
          <StatusBadge status={props.status} />
        </td>
        <td className="py-3 pr-5">{props.startTaxYear}</td>
        <td className="py-3 pr-5">
          {props.type === 'MTD' ? `${props.type} - ${props.submissionType}` : props.type}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={5} className="pb-3">
            {props.checkList.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 py-1 text-sm text-slate-600">
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
