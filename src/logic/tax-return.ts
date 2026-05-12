import { Status, Regime, TaxReturn } from '@/types/clients';

export function isFiled(taxReturn: TaxReturn): boolean {
  return taxReturn.status === Status.filed;
}

export function regimeLabel(taxReturn: TaxReturn): string {
  return taxReturn.regime === Regime.mtd ? 'MTD' : 'SA100';
}

export function firstUnfiledReturn(taxReturns: TaxReturn[]): TaxReturn | undefined {
  return taxReturns.find((taxReturn) => taxReturn.status !== Status.filed);
}

export function formatDeadline(d: Date): string {
  return d.toLocaleDateString('en-GB', { timeZone: 'UTC' });
}

export function mostRecentReturn(taxReturns: TaxReturn[]): TaxReturn | undefined {
  if (!taxReturns.length) return undefined;
  return taxReturns.reduce((prev, cur) => {
    return prev.taxYear > cur.taxYear ? prev : cur;
  });
}
