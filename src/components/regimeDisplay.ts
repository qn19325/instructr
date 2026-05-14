import type { Regime } from '@/types/clients';

type RegimeDisplay = {
  textColor: string;
  bgColor: string;
  label: string;
};

export const regimeDisplay: Record<Regime, RegimeDisplay> = {
  sa100: { textColor: 'text-violet-700', bgColor: 'bg-violet-100', label: 'SA100' },
  mtd: { textColor: 'text-cyan-700', bgColor: 'bg-cyan-100', label: 'MTD' },
};
