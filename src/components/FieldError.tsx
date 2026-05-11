export default function FieldError({
  fieldErrors,
  name,
}: {
  fieldErrors: Record<string, string> | undefined;
  name: string;
}) {
  if (!fieldErrors) return null;
  if (!fieldErrors[name]) return null;
  return <p className="mt-1 text-xs text-red-600">{fieldErrors[name]}</p>;
}
