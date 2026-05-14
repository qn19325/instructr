'use client';

import { useState, useRef, useTransition, useOptimistic } from 'react';

import ColorDot from '@/components/ColorDot';
import { ALLOWED_TYPES } from '@/logic/document-validation';
import { type ChecklistItem } from '@/types/clients';
import { type Document } from '@/types/documents';

import { getDocumentDownloadUrl, toggleChecklistItem } from './actions';
import { useDocumentUpload } from './useDocumentUpload';

export default function ChecklistItem({
  clientId,
  item,
}: {
  clientId: string;
  item: ChecklistItem;
}) {
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
    <div className="flex items-center">
      <div className="flex flex-1 gap-2">
        <button type="button" onClick={handleClick} disabled={isPending}>
          <ColorDot color={optimisticDone ? 'bg-green-500' : 'bg-red-500'} />
        </button>
        <div className="text-sm font-semibold text-slate-400">{item.text}</div>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file)
            startTransition(async () => {
              await upload(file, item.id);
            });
        }}
        accept={ALLOWED_TYPES.join(',')}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={state.phase !== 'idle' && state.phase !== 'done'}
        className="cursor-pointer rounded-md bg-indigo-600 px-1 py-0.5 text-sm font-extrabold text-white hover:bg-indigo-700"
      >
        +
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
