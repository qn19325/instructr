import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="flex max-w-md flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 rounded-full border-4 border-indigo-200 bg-indigo-600"></div>
        <div className="text-xl font-bold text-slate-900">Instructr</div>
      </div>
      <div className="text-slate-500">Practice management for accountants.</div>
      <SignIn />
      <div className="flex items-center justify-between gap-2">
        <div className="h-0.5 w-full bg-slate-200"></div>
        <div className="text-xs font-bold text-slate-400">OR</div>
        <div className="h-0.5 w-full bg-slate-200"></div>
      </div>
      <a
        href="https://demo.instructr.uk"
        target="_blank"
        rel="noreferrer"
        className="flex w-full items-center justify-between rounded-md border-2 border-slate-200 p-4"
      >
        <div className="flex flex-col gap-0.5">
          <div className="text-sm font-bold text-slate-900">View Demo</div>
          <div className="text-xs font-semibold text-slate-400">demo.instructr.uk</div>
        </div>
        <div className="text-md flex h-6 w-6 items-center justify-center rounded-full bg-indigo-200 font-bold text-indigo-600">
          {'\u2192'}
        </div>
      </a>
    </div>
  );
}
