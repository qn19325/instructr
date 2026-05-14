import type * as schema from '@/db/schema';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export type Tx = Parameters<Parameters<PostgresJsDatabase<typeof schema>['transaction']>[0]>[0];
export type DbOrTx = PostgresJsDatabase<typeof schema> | Tx;
export function withTransaction<T>(
  db: PostgresJsDatabase<typeof schema>,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return db.transaction(fn);
}
