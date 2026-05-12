export function formatDayOfWeek(d: Date): string {
  return d.toLocaleString('en-GB', { weekday: 'short', timeZone: 'UTC' }).toUpperCase();
}

export function formatDayNumber(d: Date): string {
  return d.toLocaleString('en-GB', { day: '2-digit', timeZone: 'UTC' });
}
