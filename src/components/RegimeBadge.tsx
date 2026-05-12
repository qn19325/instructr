import { Regime } from '@/types/clients';
import { regimeDisplay } from '@/components/regimeDisplay';

export default function RegimeBadge({ regime }: { regime: Regime }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-xs font-semibold ${regimeDisplay[regime].bgColor} ${regimeDisplay[regime].textColor}`}
    >
      {regimeDisplay[regime].label}
    </span>
  );
}
