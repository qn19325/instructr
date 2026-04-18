import { getDeadlineEntries } from '@/lib/helpers';
import { clients } from '@/lib/mock-data';
import { DeadlineEntry } from '@/types/calendarModels';
import { Fragment } from 'react';
import { Status } from '@/types/clients';

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
    <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
      <div className="mb-6 text-xl font-semibold text-slate-900">Deadlines</div>
      <table>
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-medium tracking-wide text-slate-400 uppercase">
            <th className="pr-5 pb-2">Name</th>
            <th className="pr-5 pb-2">Deadline</th>
            <th className="pr-5 pb-2">Tax Year</th>
            <th className="pr-5 pb-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedDeadlineEntries).map(([month, entries]) => (
            <Fragment key={month}>
              <tr>
                <td
                  colSpan={4}
                  className="pt-4 pb-2 text-xs font-medium tracking-wide text-slate-400 uppercase"
                >
                  {month}
                </td>
              </tr>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50"
                >
                  <td className="py-3 pr-5">{entry.name}</td>
                  <td className="py-3 pr-5">{entry.deadline.toDateString()}</td>
                  <td className="py-3 pr-5">{entry.taxYearLabel}</td>
                  <td className="inline-flex py-3 pr-5">
                    <div
                      className={`my-auto mr-1 h-3 w-3 rounded-lg ${entry.status === Status.filed ? 'bg-green-500' : 'bg-red-500'}`}
                    ></div>
                    <div>{entry.status}</div>
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
