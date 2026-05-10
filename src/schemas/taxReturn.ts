import { type } from 'arktype';
import { Regime } from '@/types/clients';
import { currentTaxYear } from '@/lib/tax-return';

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
