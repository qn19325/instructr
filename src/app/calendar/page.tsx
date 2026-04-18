import { getDeadlineEntries } from '@/lib/helpers';
import { clients } from '@/lib/mock-data';
import { DeadlineEntry } from '@/types/calendarModels';

export default async function Page() {
  const pageData: DeadlineEntry[] = getDeadlineEntries(clients);

  const groupedDeadlineEntries: Record<string, DeadlineEntry[]> = pageData.reduce(
    (acc, entry) => {
      const month: string = entry.deadline.toLocaleString('en-GB', {
        month: 'long',
        year: 'numeric',
      });

      if (!acc[month]) {
        acc[month] = [];
      }

      acc[month].push(entry);

      return acc;
    },
    {} as Record<string, DeadlineEntry[]>,
  );

  return (
    <div>
      {Object.entries(groupedDeadlineEntries).map(([month, entries]) => {
        return (
          <div key={month}>
            <div>{month}</div>
            <div>
              {entries.map((entry) => {
                return (
                  <div key={entry.id}>
                    <div>{entry.name}</div>
                    <div>{entry.deadline.toDateString()}</div>
                    <div>{entry.taxYearLabel}</div>
                    <div>{entry.status}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
