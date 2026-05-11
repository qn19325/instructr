export default function FormActions({
  onClose,
  isPending,
  submitLabel,
}: {
  onClose: () => void;
  isPending: boolean;
  submitLabel: string;
}) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        className="text-sm text-slate-500 hover:text-slate-800"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {isPending ? 'Loading...' : submitLabel}
      </button>
    </div>
  );
}
