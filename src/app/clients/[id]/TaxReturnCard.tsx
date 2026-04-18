'use client';

import { MTDTaxReturn, SA100TaxReturn, Status } from '@/types/clients';
import { useState } from 'react';

// TODO: remove this when we move to real data and update to internal models vs api models
export type TaxReturnCardProps =
  | (Omit<SA100TaxReturn, 'deadline'> & { deadline: string; name: string })
  | (Omit<MTDTaxReturn, 'deadline'> & { deadline: string; name: string });

export default function Card({
  name,
  id,
  deadline,
  status,
  startTaxYear,
  checkList,
  type,
}: TaxReturnCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <tr
        className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50"
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <td className="py-3 pr-5">{name}</td>
        <td className="py-3 pr-5">{deadline}</td>
        <td className="inline-flex py-3 pr-5">
          <div
            className={`my-auto mr-1 h-3 w-3 rounded-full ${status === Status.filed ? 'bg-green-500' : 'bg-red-500'}`}
          ></div>
          <div>{status}</div>
        </td>
        <td className="py-3 pr-5">{startTaxYear}</td>
        <td className="py-3 pr-5">{type}</td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={5} className="pb-3">
            {checkList.map((item) => (
              <div key={item.text} className="flex items-center gap-2 py-1 text-sm text-slate-600">
                <div
                  className={`h-3 w-3 rounded-full ${item.received ? 'bg-green-500' : 'bg-red-500'}`}
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
