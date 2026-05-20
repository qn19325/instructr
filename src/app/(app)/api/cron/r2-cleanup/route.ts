import { NextResponse } from 'next/server';

import { getCurrentDb } from '@/infra/db';
import { drainPendingDeletes } from '@/service/documents';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getCurrentDb();

  const res = await drainPendingDeletes(db);

  return NextResponse.json(res);
}
