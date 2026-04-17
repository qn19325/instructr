import { Client, Status, Regime } from '@/types/clients';

export const clients: Client[] = [];

const statuses = [
  Status.not_started,
  Status.in_progress,
  Status.awaiting_client,
  Status.ready_to_file,
  Status.filed,
];

for (let i = 0; i < statuses.length; i++) {
  const client: Client = {
    id: `${i}`,
    niNumber: `AB 00 00 0${i} C`,
    name: `Client ${i}`,
    email: `client${i}@mail.com`,
    taxReturns: [
      {
        deadline: new Date(),
        status: statuses[i],
        startTaxYear: new Date().getFullYear() - i,
      },
    ],
    regimeType: i % 2 === 0 ? Regime.SA100 : Regime.MTD,
  };
  clients.push(client);
}
