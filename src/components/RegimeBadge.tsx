import { regimeDisplay } from '@/components/regimeDisplay';
import type { Regime } from '@/types/clients';

export default function RegimeBadge({ regime }: { regime: Regime }) {
  return (
    <span
      className={`h-fit w-fit rounded px-1.5 py-0.5 text-xs font-semibold ${regimeDisplay[regime].bgColor} ${regimeDisplay[regime].textColor}`}
    >
      {regimeDisplay[regime].label}
    </span>
  );
}
