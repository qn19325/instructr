import type { TaxReturn, Client } from '@/types/clients';
import { Status, Regime } from '@/types/clients';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function isFiled(taxReturn: TaxReturn): boolean {
  return taxReturn.status === Status.filed;
}

export function regimeLabel(taxReturn: TaxReturn): string {
  return taxReturn.regime === Regime.mtd ? 'MTD' : 'SA100';
}

export function firstUnfiledReturn(taxReturns: TaxReturn[]): TaxReturn | undefined {
  return taxReturns.find((taxReturn) => taxReturn.status !== Status.filed);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function mostRecentReturn(taxReturns: TaxReturn[]): TaxReturn | undefined {
  if (!taxReturns.length) return undefined;
  return taxReturns.reduce((prev, cur) => {
    return prev.taxYear > cur.taxYear ? prev : cur;
  });
}

export function numberOfClientsWithUnfiled(clients: Client[]): number {
  return clients.filter((client) => !!firstUnfiledReturn(client.taxReturns)).length;
}

export function daysTillNextDeadline(deadline: Date, today: Date = new Date()): number {
  const differenceInMs: number = deadline.getTime() - today.getTime();
  return Math.trunc(differenceInMs / MS_PER_DAY);
}
