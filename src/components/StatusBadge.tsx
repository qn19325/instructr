import { Status } from '@/types/clients';

interface StatusBadgeProps {
  status: Status;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <div className="flex flex-row">
      <div
        className={`my-auto mr-1 h-3 w-3 rounded-full ${status === Status.filed ? 'bg-green-500' : 'bg-red-500'}`}
      ></div>
      <div>{status}</div>
    </div>
  );
}
