import { mtdSubmission } from '@/db/schema';
import { MtdSubmissionStatus, type SubmissionType } from '@/types/clients';

import type { DbOrTx } from './index';

export async function insertMtdSubmissions(
  practiceId: string,
  taxReturnId: string,
  submissionTypes: SubmissionType[],
  conn: DbOrTx,
): Promise<void> {
  await conn.insert(mtdSubmission).values(
    submissionTypes.map((submissionType) => ({
      practiceId,
      taxReturnId,
      submissionType,
      status: MtdSubmissionStatus.pending,
    })),
  );
}
