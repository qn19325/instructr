import { notFound } from 'next/navigation';
import TaxReturnCard from './TaxReturnCard';
import { getClientById } from '@/db/clients';
import AddTaxReturnModal from './AddTaxReturnModal';
import EditClientModal from './EditClientModal';
import NotesSection from './NotesSection';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const client = await getClientById(id);

  if (!client) {
    notFound();
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="text-2xl font-semibold text-slate-900">
          {client.firstName} {client.lastName}
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          {client.phoneNumber && <span>{client.phoneNumber}</span>}
          {client.email && <span>{client.email}</span>}
          <span className="font-mono">{client.niNumber}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
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
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-medium tracking-wide text-slate-400 uppercase">
            <th className="pr-5 pb-2">Deadline</th>
            <th className="pr-5 pb-2">Status</th>
            <th className="pr-5 pb-2">Tax Year</th>
            <th className="pr-5 pb-2">Type</th>
          </tr>
        </thead>
        <tbody>
          {client.taxReturns.map((taxReturn) => {
            return <TaxReturnCard key={taxReturn.id} {...taxReturn} />;
          })}
        </tbody>
      </table>
      <NotesSection clientId={client.id} currentNotes={client.notes} />
    </>
  );
}
