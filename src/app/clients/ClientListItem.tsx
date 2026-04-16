import Link from 'next/link';
import { Client } from '@/types/clients';

export default function ClientListItem({ id, name, regimeType, taxReturns }: Client) {
  return (
    <Link href={`/clients/${id}`}>
      <div>{name}</div>
      <div>{regimeType}</div>
      <div>{taxReturns[0].deadline.toDateString()}</div>
      <div>{taxReturns[0].status}</div>
    </Link>
  );
}
