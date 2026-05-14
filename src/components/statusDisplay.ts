import type { MtdSubmissionStatus, Status } from '@/types/clients';

export type StatusDisplay = {
  textColor: string;
  bgColor: string;
  dotColor: string;
  label: string;
};

export const taxReturnStatusDisplay: Record<Status, StatusDisplay> = {
  not_started: {
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    dotColor: 'bg-slate-700',
    label: 'Not Started',
  },
  in_progress: {
    bgColor: 'bg-amber-100',
    dotColor: 'bg-amber-700',
    textColor: 'text-amber-700',
    label: 'In Progress',
  },
  awaiting_client: {
    bgColor: 'bg-blue-100',
    dotColor: 'bg-blue-700',
    textColor: 'text-blue-700',
    label: 'Awaiting Client',
  },
  ready_to_file: {
    bgColor: 'bg-green-100',
    dotColor: 'bg-green-700',
    textColor: 'text-green-700',
    label: 'Ready To File',
  },
  filed: {
    bgColor: 'bg-green-100',
    dotColor: 'bg-green-700',
    textColor: 'text-green-700',
    label: 'Filed',
  },
};

export const mtdSubmissionStatusDisplay: Record<MtdSubmissionStatus, StatusDisplay> = {
  pending: {
    bgColor: 'bg-orange-100',
    dotColor: 'bg-orange-700',
    textColor: 'text-orange-700',
    label: 'Pending',
  },
  submitted: {
    bgColor: 'bg-green-100',
    dotColor: 'bg-green-700',
    textColor: 'text-green-700',
    label: 'Submitted',
  },
  overdue: {
    bgColor: 'bg-red-100',
    dotColor: 'bg-red-700',
    textColor: 'text-red-700',
    label: 'Overdue',
  },
};
