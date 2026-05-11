export default function FormError({ error }: { error: string | undefined }) {
  if (!error) return null;
  return <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>;
}
