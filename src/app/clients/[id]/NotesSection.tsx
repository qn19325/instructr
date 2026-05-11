'use client';

import { ChangeEvent, useState } from 'react';
import { saveNotes } from './actions';

type SavingState =
  | { phase: 'idle' }
  | { phase: 'saving' }
  | { phase: 'saved' }
  | { phase: 'error'; message: string };

interface NotesSectionProps {
  clientId: string;
  currentNotes?: string;
}

export default function NotesSection(props: NotesSectionProps) {
  const [notes, setNotes] = useState(props.currentNotes ?? '');
  const [savingState, setSavingState] = useState<SavingState>({ phase: 'idle' });

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setNotes(e.target.value);
    setSavingState({ phase: 'idle' });
  }

  async function handleSave() {
    try {
      setSavingState({ phase: 'saving' });
      const res = await saveNotes(props.clientId, notes);
      setSavingState(res.success ? { phase: 'saved' } : { phase: 'error', message: res.error });
    } catch {
      setSavingState({ phase: 'error', message: 'Failed to save notes' });
    }
  }

  return (
    <div className="mt-8">
      <div className="border-b border-slate-200 pb-2 text-xs font-medium text-slate-400 uppercase">
        Notes
      </div>
      <textarea
        className="mt-3 w-full text-sm text-slate-700"
        rows={4}
        value={notes}
        placeholder="No notes yet."
        onChange={handleChange}
      />
      <div className="mt-2 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={savingState.phase === 'saving'}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Save
        </button>
        {savingState.phase === 'saving' && <p className="text-sm text-slate-400">Saving…</p>}
        {savingState.phase === 'saved' && <p className="text-sm text-slate-400">Saved</p>}
        {savingState.phase === 'error' && (
          <p className="text-sm text-red-500">{savingState.message}</p>
        )}
      </div>
    </div>
  );
}
