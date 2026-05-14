import { NextResponse } from 'next/server';

import { drainPendingDeletes } from '@/service/documents';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const res = await drainPendingDeletes();

  return NextResponse.json({ ...res });
}
