'use client';

import ColorDot from '@/components/ColorDot';
import StatusBadge from '@/components/StatusBadge';
import { ChecklistItem, MTDTaxReturn, SA100TaxReturn } from '@/types/clients';
import { useRef, useState } from 'react';
import { formatDeadline } from '@/lib/deadlines';
import { nextDeadline } from '@/lib/clients';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { getDownloadUrl } from '../actions';

export type TaxReturnCardProps = SA100TaxReturn | MTDTaxReturn;

function ChecklistRow({ item }: { item: ChecklistItem }) {
  const { upload, isUploading, error } = useDocumentUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-2 py-1 text-sm text-slate-600">
      <ColorDot color={item.done ? 'bg-green-500' : 'bg-red-500'} />
      <div>{item.text}</div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file, item.id);
        }}
      />
      <button onClick={() => inputRef.current?.click()}>Upload</button>
      {item.document && (
        <a
          href="#"
          onClick={async (e) => {
            if (!item.document) return;
            e.preventDefault();
            const url = await getDownloadUrl(item.document.id);
            window.open(url, '_blank');
          }}
        >
          {item.document.originalFileName}
        </a>
      )}
      {isUploading && <span>Uploading...</span>}
      {error && <span className="text-red-500">{error}</span>}
    </div>
  );
}

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
              <ChecklistRow key={item.id} item={item} />
            ))}
          </td>
        </tr>
      )}
    </>
  );
}
