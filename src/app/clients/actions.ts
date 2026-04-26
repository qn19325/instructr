'use server';

import { db } from '@/db';
import { Regime, Status } from '@/types/clients';
import { client, taxReturn, checklistItem } from '@/db/schema';
import { PRACTICE_ID } from '@/db/queries/clients';
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

export default async function createClient(props: ClientActionsProps) {
  await db.transaction(async (tx) => {
    const [newClient] = await tx
      .insert(client)
      .values({
        practiceId: PRACTICE_ID,
        firstName: props.firstName,
        lastName: props.lastName,
        niNumber: props.niNumber,
        email: props.email,
        phoneNumber: props.phone,
        regime: props.regime,
      })
      .returning();

    const [newTaxReturn] = await tx
      .insert(taxReturn)
      .values({
        practiceId: PRACTICE_ID,
        clientId: newClient.id,
        taxYear: currentTaxYear(),
        regime: props.regime,
        status: Status.not_started,
        deadline: `${currentTaxYear() + 1}-01-31`,
      })
      .returning();

    const checkList = props.regime === 'MTD' ? mtdChecklist : sa100Checklist;
    await Promise.all(
      checkList.map((item) => {
        return tx.insert(checklistItem).values({
          practiceId: PRACTICE_ID,
          taxReturnId: newTaxReturn.id,
          documentType: item.documentType,
          label: item.label,
          done: false,
        });
      }),
    );
  });
  revalidatePath('/clients');
}
