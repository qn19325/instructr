import ColorDot from '@/components/ColorDot';
import type {
  StatusDisplay} from '@/components/statusDisplay';
import {
  taxReturnStatusDisplay,
  mtdSubmissionStatusDisplay,
} from '@/components/statusDisplay';
import type { Status, MtdSubmissionStatus } from '@/types/clients';

type AnyStatus = Status | MtdSubmissionStatus;

const statusDisplay: Record<AnyStatus, StatusDisplay> = {
  ...taxReturnStatusDisplay,
  ...mtdSubmissionStatusDisplay,
};

interface StatusBadgeProps {
  status: AnyStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <div
      className={`flex h-fit w-fit rounded px-1.5 py-0.5 text-xs font-semibold ${statusDisplay[status].textColor} ${statusDisplay[status].bgColor}`}
    >
      <ColorDot color={statusDisplay[status].dotColor} className="my-auto mr-1" />
      <div>{statusDisplay[status].label}</div>
    </div>
  );
}
