import type { TaxReturn, Client } from '@/types/clients';
import { Status, Regime } from '@/types/clients';

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
  const filtered = clients.filter((client) => {
    return !!firstUnfiledReturn(client.taxReturns);
  });
  return filtered.length;
}

export function daysTillNextDeadline(deadline: Date, today: Date = new Date()): number {
  const differenceInMs: number = deadline.getTime() - today.getTime();
  const millisecondsInDay: number = 1000 * 60 * 60 * 24;
  return Math.trunc(differenceInMs / millisecondsInDay);
}
