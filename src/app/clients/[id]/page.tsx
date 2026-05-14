import { notFound } from 'next/navigation';

import { getCurrentPracticeId } from '@/infra/auth';
import { getCurrentDb } from '@/infra/db';
import { getClientById } from '@/service/clients';

import AddTaxReturnModal from './AddTaxReturnModal';
import EditClientModal from './EditClientModal';
import NotesSection from './NotesSection';
import TaxReturnCard from './TaxReturnCard';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const db = await getCurrentDb();
  const practiceId = await getCurrentPracticeId();
  const client = await getClientById(db, practiceId, id);

  if (!client) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between">
        <div className="flex flex-col">
          <div className="mb-4 text-2xl font-bold text-slate-900">
            {client.firstName} {client.lastName}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-400">Contact</div>
            {client.phoneNumber && (
              <div className="text-sm font-semibold text-slate-900">{client.phoneNumber}</div>
            )}
            {client.email && (
              <div className="text-sm font-semibold text-slate-900">{client.email}</div>
            )}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-400">NI Number</div>
            <div className="font-mono text-sm font-semibold text-slate-900">{client.niNumber}</div>
          </div>
        </div>
        <div className="flex justify-between gap-2 align-top">
          <EditClientModal
            id={client.id}
            niNumber={client.niNumber}
            firstName={client.firstName}
            lastName={client.lastName}
            email={client.email}
            phoneNumber={client.phoneNumber}
          />
          <AddTaxReturnModal clientId={client.id} existingTaxReturns={client.taxReturns} />
        </div>
      </div>
      {client.taxReturns.map((taxReturn) => {
        return <TaxReturnCard key={taxReturn.id} clientId={client.id} taxReturn={taxReturn} />;
      })}
      <NotesSection clientId={client.id} currentNotes={client.notes} />
    </div>
  );
}
