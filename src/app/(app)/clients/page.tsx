import { cols } from '@/app/(app)/clients/clientsGrid';
import { getCurrentPracticeId } from '@/infra/auth';
import { getCurrentDb } from '@/infra/db';
import { numberOfClientsWithUnfiled } from '@/logic/tax-return';
import { getClients } from '@/service/clients';

import AddClientModal from './AddClientModal';
import ClientListItem from './ClientListItem';

export default async function Page() {
  const db = await getCurrentDb();
  const practiceId = await getCurrentPracticeId();
  const clients = await getClients(db, practiceId);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold text-slate-900">Clients</div>
          <div className="mb-6 text-sm text-slate-400">{`${clients.length} active - ${numberOfClientsWithUnfiled(clients)} needing attention`}</div>
        </div>
        <AddClientModal />
      </div>
      <div className="flex flex-col">
        <div className={`${cols} mb-2`}>
          <div className="text-sm font-semibold text-slate-900 uppercase">Name</div>
          <div className="text-sm font-semibold text-slate-900 uppercase">Regime</div>
          <div className="text-sm font-semibold text-slate-900 uppercase">Next Deadline</div>
          <div className="text-sm font-semibold text-slate-900 uppercase">Status</div>
        </div>
        <div>
          {clients.map((client) => {
            return <ClientListItem key={client.id} client={client} />;
          })}
        </div>
      </div>
    </>
  );
}
