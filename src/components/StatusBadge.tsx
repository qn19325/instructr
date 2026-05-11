import { Status, MtdSubmissionStatus } from '@/types/clients';
import ColorDot from '@/components/ColorDot';
import { taxReturnStatusDisplay, Display, mtdSubmissionStatusDisplay } from '@/lib/status';

type AnyStatus = Status | MtdSubmissionStatus;

const statusDisplay: Record<AnyStatus, Display> = {
  ...taxReturnStatusDisplay,
  ...mtdSubmissionStatusDisplay,
};

interface StatusBadgeProps {
  status: AnyStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <div className="flex flex-row">
      <ColorDot color={statusDisplay[status].color} className="my-auto mr-1" />
      <div>{statusDisplay[status].label}</div>
    </div>
  );
}
