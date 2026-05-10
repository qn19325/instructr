import { notFound } from 'next/navigation';
import TaxReturnCard from './TaxReturnCard';
import { getClientById } from '@/db/clients';
import AddTaxReturnModal from './AddTaxReturnModal';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const clientRecord = await getClientById(id);

  if (!clientRecord) {
    notFound();
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="text-2xl font-semibold text-slate-900">
          {clientRecord.firstName} {clientRecord.lastName}
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          {clientRecord.phoneNumber && <span>{clientRecord.phoneNumber}</span>}
          {clientRecord.email && <span>{clientRecord.email}</span>}
          <span className="font-mono">{clientRecord.niNumber}</span>
        </div>
        <AddTaxReturnModal
          clientId={clientRecord.id}
          existingTaxReturns={clientRecord.taxReturns}
        />
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
          {clientRecord.taxReturns.map((taxReturn) => {
            return <TaxReturnCard key={taxReturn.id} {...taxReturn} />;
          })}
        </tbody>
      </table>
      <div className="mt-8">
        <div className="border-b border-slate-200 pb-2 text-xs font-medium text-slate-400 uppercase">
          Notes
        </div>
        <p className="mt-3 text-sm text-slate-400">No notes yet.</p>
      </div>
    </>
  );
}
