import { clients } from '@/lib/mock-data';
import ClientListItem from './ClientListItem';

export default async function Page() {
  return (
    <div className="overflow-y-auto bg-slate-50 p-8">
      <div className="mb-6 text-xl font-semibold text-slate-900">Clients</div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-medium tracking-wide text-slate-400 uppercase">
            <th className="pr-5 pb-2">Name</th>
            <th className="pr-5 pb-2">Regime</th>
            <th className="pr-5 pb-2">Next Deadline</th>
            <th className="pr-5 pb-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => {
            return <ClientListItem key={client.id} {...client} />;
          })}
        </tbody>
      </table>
    </div>
  );
}
