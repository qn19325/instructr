'use client';

import ColorDot from '@/components/ColorDot';
import StatusBadge from '@/components/StatusBadge';
import { ChecklistItem, Status, TaxReturn } from '@/types/clients';
import { useRef, useState, useTransition, useOptimistic } from 'react';
import { formatDeadline, regimeLabel } from '@/logic/tax-return';
import { useDocumentUpload } from './useDocumentUpload';
import { changeTaxReturnStatus, getDocumentDownloadUrl, toggleChecklistItem } from './actions';
import { ALLOWED_TYPES } from '@/logic/document-validation';
import { Document } from '@/types/documents';
import { taxReturnStatusDisplay } from '@/components/statusDisplay';
import { nextDeadline } from '@/logic/deadlines';

function ChecklistRow({ clientId, item }: { clientId: string; item: ChecklistItem }) {
  const { upload, state } = useDocumentUpload();
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const doc = item.document;
  const [isPending, startTransition] = useTransition();
  const [optimisticDone, setOptimisticDone] = useOptimistic(item.done);
  const [toggleError, setToggleError] = useState<string | null>(null);

  async function handleDownload(document: Document) {
    try {
      setDownloadError(null);
      const url = await getDocumentDownloadUrl(document.id);
      window.open(url, '_blank');
    } catch {
      setDownloadError('Download failed');
    }
  }

  function handleClick() {
    startTransition(async () => {
      setOptimisticDone((prev) => !prev);
      setToggleError(null);
      const res = await toggleChecklistItem(item.id, clientId, item.done);
      if (!res.success) setToggleError(res.error);
    });
  }

  return (
    <div className="flex items-center gap-2 py-1 text-sm text-slate-600">
      <button type="button" onClick={handleClick} disabled={isPending}>
        <ColorDot color={optimisticDone ? 'bg-green-500' : 'bg-red-500'} />
      </button>
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
        disabled={state.phase !== 'idle' && state.phase !== 'done'}
      >
        Upload
      </button>
      {doc && (
        <button type="button" onClick={() => handleDownload(doc)}>
          {doc.originalFileName}
        </button>
      )}
      {(state.phase === 'validating' ||
        state.phase === 'uploading' ||
        state.phase === 'recording') && <span>{`${state.phase}...`}</span>}
      {state.phase === 'error' && <span className="text-red-500">{state.message}</span>}
      {downloadError && <span className="text-red-500">{downloadError}</span>}
      {toggleError && <span className="text-red-500">{toggleError}</span>}
    </div>
  );
}

interface TaxReturnCardProps {
  clientId: string;
  taxReturn: TaxReturn;
}

export default function TaxReturnCard({ clientId, taxReturn }: TaxReturnCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const deadlineDate = nextDeadline(taxReturn);
  const [isEditing, setIsEditing] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(taxReturn.status);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    e.stopPropagation();
    const newStatus = Object.values(Status).find((s) => s === e.target.value);
    if (!newStatus) return;
    setIsEditing(false);
    startTransition(async () => {
      setOptimisticStatus(newStatus);
      setStatusError(null);
      const res = await changeTaxReturnStatus(taxReturn.id, clientId, newStatus);
      if (!res.success) setStatusError(res.error);
    });
  }

  return (
    <>
      <tr
        className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50"
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <td className="py-3 pr-5">{deadlineDate ? formatDeadline(deadlineDate) : '—'}</td>
        <td className="py-3 pr-5">
          {isEditing ? (
            <select
              autoFocus
              defaultValue={optimisticStatus}
              onChange={handleStatusChange}
              onBlur={() => setIsEditing(false)}
              onClick={(e) => e.stopPropagation()}
            >
              {Object.entries(taxReturnStatusDisplay).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              <StatusBadge status={optimisticStatus} />
            </button>
          )}
          {statusError && <span className="text-sm text-red-500">{statusError}</span>}
        </td>
        <td className="py-3 pr-5">{taxReturn.taxYear}</td>
        <td className="py-3 pr-5">{regimeLabel(taxReturn)}</td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={4} className="pb-3">
            {taxReturn.checklist.map((item) => (
              <ChecklistRow key={item.id} clientId={clientId} item={item} />
            ))}
          </td>
        </tr>
      )}
    </>
  );
}
