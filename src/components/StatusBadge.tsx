import { Status, MtdSubmissionStatus } from '@/types/clients';

type AnyStatus = Status | MtdSubmissionStatus;

const statusDisplay: Record<AnyStatus, { color: string; label: string }> = {
  not_started: { color: 'bg-slate-500', label: 'Not Started' },
  in_progress: { color: 'bg-blue-500', label: 'In Progress' },
  awaiting_client: { color: 'bg-amber-400', label: 'Awaiting Client' },
  ready_to_file: { color: 'bg-indigo-500', label: 'Ready To File' },
  filed: { color: 'bg-green-500', label: 'Filed' },
  pending: { color: 'bg-slate-400', label: 'Pending' },
  submitted: { color: 'bg-green-500', label: 'Submitted' },
  overdue: { color: 'bg-red-500', label: 'Overdue' },
};

interface StatusBadgeProps {
  status: AnyStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <div className="flex flex-row">
      <div className={`my-auto mr-1 h-3 w-3 rounded-full ${statusDisplay[status].color}`}></div>
      <div>{statusDisplay[status].label}</div>
    </div>
  );
}
