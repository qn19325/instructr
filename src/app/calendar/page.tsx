import Link from 'next/link';

import Chevron from '@/components/Chevron';
import RegimeBadge from '@/components/RegimeBadge';
import StatusBadge from '@/components/StatusBadge';
import { getCurrentPracticeId } from '@/infra/auth';
import { getCurrentDb } from '@/infra/db';
import { formatDayOfWeek, formatDayNumber } from '@/logic/calendar';
import { deadlineSubLine, getDeadlineEntries, groupDeadlinesByMonth } from '@/logic/deadlines';
import { getClients } from '@/service/clients';

export default async function Page() {
  const db = await getCurrentDb();
  const practiceId = await getCurrentPracticeId();
  const clients = await getClients(db, practiceId);
  const entries = getDeadlineEntries(clients);

  const grouped = groupDeadlinesByMonth(entries);

  return (
    <>
      <div className="text-xl font-semibold text-slate-900">Calendar</div>
      <div className="mb-6 text-sm text-slate-400">Submission deadlines across all clients</div>

      {entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No deadlines to show.</p>
      ) : (
        Object.entries(grouped).map(([month, monthEntries]) => (
          <div key={month}>
            <div className="flex items-baseline gap-2 border-b border-slate-200 pt-6 pb-3">
              <span className="text-sm font-semibold text-slate-900">{month}</span>
              <span className="text-xs text-slate-400">
                {monthEntries.length} {monthEntries.length === 1 ? 'deadline' : 'deadlines'}
              </span>
            </div>
            {monthEntries.map((entry) => (
              <Link
                key={entry.id}
                href={`/clients/${entry.clientId}`}
                className="flex items-center gap-4 border-b border-slate-100 bg-white py-3 transition-colors hover:bg-slate-100"
              >
                <div className="w-10 shrink-0 text-center">
                  <div className="text-xs text-slate-400">{formatDayOfWeek(entry.deadline)}</div>
                  <div className="text-xl leading-tight font-bold text-slate-900">
                    {formatDayNumber(entry.deadline)}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-900">{entry.name}</div>
                  <div className="mt-0.5 text-xs text-slate-400">{deadlineSubLine(entry)}</div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <RegimeBadge regime={entry.regime} />
                  <StatusBadge status={entry.status} />
                </div>
                <Chevron />
              </Link>
            ))}
          </div>
        ))
      )}
    </>
  );
}
