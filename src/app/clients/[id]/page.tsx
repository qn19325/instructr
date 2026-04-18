import { clients } from '@/lib/mock-data';
import { notFound } from 'next/navigation';
import { TaxReturnCardProps } from './TaxReturnCard';
import Card from './TaxReturnCard';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const client = clients.find((cli) => cli.id === id);

  if (!client) {
    notFound();
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
      <div className="mb-6 text-xl font-semibold text-slate-900">
        {client.name} - {client.niNumber}
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-medium tracking-wide text-slate-400 uppercase">
            <th className="pr-5 pb-2">Name</th>
            <th className="pr-5 pb-2">Deadline</th>
            <th className="pr-5 pb-2">Status</th>
            <th className="pr-5 pb-2">Tax Year</th>
            <th className="pr-5 pb-2">Type</th>
          </tr>
        </thead>
        <tbody>
          {client.taxReturns.map((taxReturn) => {
            const taxReturnCardProps: TaxReturnCardProps = {
              ...taxReturn,
              name: client.name,
              deadline: taxReturn.deadline.toLocaleDateString('en-GB'),
            };
            return <Card key={taxReturn.id} {...taxReturnCardProps} />;
          })}
        </tbody>
      </table>
      <div>
        <div className="border-b border-slate-200 pb-2 text-xs font-medium text-slate-400 uppercase">
          Notes
        </div>
        <div className="mt-2 flex-1 overflow-y-auto bg-white p-2">Placeholder...</div>
      </div>
    </div>
  );
}
