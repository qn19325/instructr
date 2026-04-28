'use server';

import { db } from '@/db';
import { Regime, Status, SubmissionType } from '@/types/clients';
import { client, taxReturn, checklistItem, mtdSubmission } from '@/db/schema';
import { getCurrentPracticeId } from '@/lib/auth';
import { currentTaxYear } from '@/lib/helpers';
import { mtdChecklist, sa100Checklist } from '@/lib/checklistDefaults';
import { revalidatePath } from 'next/cache';

interface ClientActionsProps {
  firstName: string;
  lastName: string;
  niNumber: string;
  email: string;
  phone?: string;
  regime: Regime;
}

type CreateClientResult = { success: true } | { success: false; error: string };

export default async function createClient(props: ClientActionsProps): Promise<CreateClientResult> {
  try {
    await db.transaction(async (tx) => {
      const [newClient] = await tx
        .insert(client)
        .values({
          practiceId: getCurrentPracticeId(),
          firstName: props.firstName,
          lastName: props.lastName,
          niNumber: props.niNumber,
          email: props.email,
          phoneNumber: props.phone,
        })
        .returning();

      const [newTaxReturn] = await tx
        .insert(taxReturn)
        .values({
          practiceId: getCurrentPracticeId(),
          clientId: newClient.id,
          taxYear: currentTaxYear(),
          regime: props.regime,
          status: Status.not_started,
          deadline: `${currentTaxYear() + 1}-01-31`,
        })
        .returning();

        
        if (props.regime === Regime.mtd) {
          const quarters = [                                                                                                              
           { submissionType: SubmissionType.q_1, deadline: `${currentTaxYear()}-08-07` },                                                                                                                                                                                                 
           { submissionType: SubmissionType.q_2, deadline: `${currentTaxYear()}-11-07` },                                                                                                                                                                                                 
           { submissionType: SubmissionType.q_3, deadline: `${currentTaxYear() + 1}-02-07` },                                                                                                                                                                                             
           { submissionType: SubmissionType.q_4, deadline: `${currentTaxYear() + 1}-05-07` },                                                                                                                                                                                             
         ]; 
          await tx.insert(mtdSubmission).values(quarters.map((quarter) => {
            return {
                practiceId: getCurrentPracticeId(),
                taxReturnId: newTaxReturn.id,
                submissionType: quarter.submissionType,
                deadline: quarter.deadline,
                status: Status.not_started,
              };
          }))
        }

      const checkList = props.regime === Regime.mtd ? mtdChecklist : sa100Checklist;

      await tx.insert(checklistItem).values(
        checkList.map((item) => ({
          practiceId: getCurrentPracticeId(),
          taxReturnId: newTaxReturn.id,
          documentType: item.documentType,
          label: item.label,
          done: false,
        })),
      );
    });

    revalidatePath('/clients');

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to create client' };
  }
}
