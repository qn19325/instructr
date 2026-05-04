import { NextResponse } from 'next/server';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2 } from '@/lib/r2';
import { deletePendingDelete, getPendingDeletes } from '@/db/documents';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pending = await getPendingDeletes();
  const results = await Promise.allSettled(
    pending.map(async (entry) => {
      await r2.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: entry.r2Key }));
      await deletePendingDelete(entry.r2Key);
      return entry.r2Key;
    }),
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  if (failed > 0) {
    results.forEach((r) => {
      if (r.status === 'rejected') console.error('R2 cleanup failed:', r.reason);
    });
  }

  return NextResponse.json({ processed: pending.length, succeeded, failed });
}
