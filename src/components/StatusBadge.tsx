import ColorDot from '@/components/ColorDot';
import type { StatusDisplay } from '@/config/statusDisplay';
import { taxReturnStatusDisplay, mtdSubmissionStatusDisplay } from '@/config/statusDisplay';
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
  const { textColor, bgColor, dotColor, label } = statusDisplay[status];
  return (
    <div
      className={`flex h-fit w-fit rounded px-1.5 py-0.5 text-xs font-semibold ${textColor} ${bgColor}`}
    >
      <ColorDot color={dotColor} className="my-auto mr-1" />
      <div>{label}</div>
    </div>
  );
}
