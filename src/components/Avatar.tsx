const colorClasses = [
  'bg-red-200 text-red-700',
  'bg-orange-200 text-orange-700',
  'bg-amber-200 text-amber-700',
  'bg-yellow-200 text-yellow-700',
  'bg-lime-200 text-lime-700',
  'bg-emerald-200 text-emerald-700',
  'bg-teal-200 text-teal-700',
  'bg-sky-200 text-sky-700',
  'bg-indigo-200 text-indigo-700',
  'bg-pink-200 text-pink-700',
];

function pickColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const len = colorClasses.length;
  return colorClasses[((hash % len) + len) % len];
}

interface AvatarProps {
  firstName: string;
  lastName: string;
}

export default function Avatar(props: AvatarProps) {
  const color = pickColor(`${props.firstName} ${props.lastName}`);
  return (
    <div
      className={`flex items-center justify-center rounded-full p-1.5 text-xs font-bold ${color}`}
    >
      {`${props.firstName[0]}${props.lastName[0]}`}
    </div>
  );
}
