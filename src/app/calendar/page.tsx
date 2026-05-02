import { getDeadlineEntries, formatDeadline } from '@/lib/deadlines';
import { DeadlineEntry } from '@/types/calendarModels';
import { Fragment } from 'react';
import StatusBadge from '@/components/StatusBadge';
import { getClients } from '@/db/clients';

export default async function Page() {
  const clients = await getClients();
  const pageData: DeadlineEntry[] = getDeadlineEntries(clients);

  const groupedDeadlineEntries = pageData.reduce<Record<string, DeadlineEntry[]>>((acc, entry) => {
    const month = entry.deadline.toLocaleString('en-GB', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
    (acc[month] ??= []).push(entry);
    return acc;
  }, {});

  return (
    <>
      <div className="mb-6 text-xl font-semibold text-slate-900">Deadlines</div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-medium tracking-wide text-slate-400 uppercase">
            <th className="pr-5 pb-2">Name</th>
            <th className="pr-5 pb-2">Deadline</th>
            <th className="pr-5 pb-2">Tax Year</th>
            <th className="pr-5 pb-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {pageData.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-8 text-center text-sm text-slate-400">
                No deadlines to show.
              </td>
            </tr>
          ) : (
            Object.entries(groupedDeadlineEntries).map(([month, entries]) => (
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
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                  >
                    <td className="py-3 pr-5">{entry.name}</td>
                    <td className="py-3 pr-5">{formatDeadline(entry.deadline)}</td>
                    <td className="py-3 pr-5">
                      {entry.taxYear}/{entry.taxYear + 1}
                    </td>
                    <td className="py-3 pr-5">
                      <StatusBadge status={entry.status} />
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}
