const TAX_YEAR_DEADLINE_MONTH_NUM = 4;
const TAX_YEAR_DEADLINE_DAY_NUM = 5;

export function currentTaxYear(today: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(today);

  const { year, month, day } = Object.fromEntries(parts.map((p) => [p.type, p.value]));

  if (
    Number(month) < TAX_YEAR_DEADLINE_MONTH_NUM ||
    (Number(month) === TAX_YEAR_DEADLINE_MONTH_NUM && Number(day) <= TAX_YEAR_DEADLINE_DAY_NUM)
  ) {
    return Number(year) - 1;
  }
  return Number(year);
}
