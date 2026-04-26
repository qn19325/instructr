import ClientListItem from './ClientListItem';
import { getClients } from '@/db/queries/clients';
import AddClientModal from './AddClientModal';

export default async function Page() {
  const clients = await getClients();
  return (
    <div className="overflow-y-auto bg-slate-50 p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="text-xl font-semibold text-slate-900">Clients</div>
        <AddClientModal />
      </div>
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
            return <ClientListItem key={client.id} client={client} />;
          })}
        </tbody>
      </table>
    </div>
  );
}
