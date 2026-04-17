import { clients } from '@/lib/mock-data';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const client = clients.find((cli) => cli.id === id);

  return <div>{client?.name}</div>;
}
