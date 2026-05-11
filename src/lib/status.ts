import { MtdSubmissionStatus, Status } from '@/types/clients';

export type Display = { color: string; label: string };

export const taxReturnStatusDisplay: Record<Status, Display> = {
  not_started: { color: 'bg-slate-500', label: 'Not Started' },
  in_progress: { color: 'bg-blue-500', label: 'In Progress' },
  awaiting_client: { color: 'bg-amber-400', label: 'Awaiting Client' },
  ready_to_file: { color: 'bg-indigo-500', label: 'Ready To File' },
  filed: { color: 'bg-green-500', label: 'Filed' },
};

export const mtdSubmissionStatusDisplay: Record<MtdSubmissionStatus, Display> = {
  pending: { color: 'bg-slate-400', label: 'Pending' },
  submitted: { color: 'bg-green-500', label: 'Submitted' },
  overdue: { color: 'bg-red-500', label: 'Overdue' },
};
