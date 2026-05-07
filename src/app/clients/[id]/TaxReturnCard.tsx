'use client';

import ColorDot from '@/components/ColorDot';
import StatusBadge from '@/components/StatusBadge';
import { ChecklistItem, MTDTaxReturn, SA100TaxReturn } from '@/types/clients';
import { useRef, useState } from 'react';
import { formatDeadline, nextDeadline } from '@/lib/deadlines';
import { useDocumentUpload } from './useDocumentUpload';
import { getDocumentDownloadUrl } from './actions';
import { ALLOWED_TYPES } from '@/lib/documents';

export type TaxReturnCardProps = SA100TaxReturn | MTDTaxReturn;

function ChecklistRow({ item }: { item: ChecklistItem }) {
  const { upload, state } = useDocumentUpload();
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const doc = item.document;

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
        accept={ALLOWED_TYPES.join(',')}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={state.state !== 'idle' && state.state !== 'done'}
      >
        Upload
      </button>
      {doc && (
        <button
          type="button"
          onClick={async () => {
            try {
              setDownloadError(null);
              const url = await getDocumentDownloadUrl(doc.id);
              window.open(url, '_blank');
            } catch {
              setDownloadError('Download failed');
            }
          }}
        >
          {doc.originalFileName}
        </button>
      )}
      {(state.state === 'validating' ||
        state.state === 'uploading' ||
        state.state === 'recording') && <span>{`${state.state}...`}</span>}
      {state.state === 'error' && <span className="text-red-500">{state.message}</span>}
      {downloadError && <span className="text-red-500">{downloadError}</span>}
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
