import { type } from 'arktype';

import { currentTaxYear } from '@/logic/tax-year';
import { Regime, Status } from '@/types/clients';

export const taxReturnInputSchema = type({
  clientId: 'string >= 1',
  taxYear: type('string')
    .pipe((s) => Number(s))
    .to('number.integer >= 2000')
    .narrow((n, ctx) => {
      if (n <= currentTaxYear() + 1) return true;
      ctx.error('Tax year is too far in the future');
      return false;
    }),
  regime: type.enumerated(...Object.values(Regime)),
});
export type CreateTaxReturnInput = typeof taxReturnInputSchema.infer;

export const updateTaxReturnStatusSchema = type({
  clientId: 'string >= 1',
  taxReturnId: 'string >= 1',
  status: type.enumerated(...Object.values(Status)),
});
export type UpdateTaxReturnStatusInput = typeof updateTaxReturnStatusSchema.infer;
