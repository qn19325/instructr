import { describe, afterAll, beforeEach, it, expect } from 'vitest';

import * as schema from '@/db/schema';
import type { CreateClientInput } from '@/schemas/clients';
import { Regime } from '@/types/clients';

import {
  getClientById,
  getClients,
  insertClient,
  updateClient,
  updateClientNotes,
} from './clients';
import { clearDB, createTestDb } from './test-utils';

function makeCreateClientInput(): CreateClientInput {
  return {
    firstName: 'Alice',
    lastName: 'Thornton',
    niNumber: 'AB 12 34 56 C',
    email: 'alice.thornton@example.com',
    phoneNumber: '07700 900001',
    regime: Regime.sa100,
  };
}

function makeClientDbRow() {
  const { firstName, lastName, niNumber, email, phoneNumber } = makeCreateClientInput();
  return { firstName, lastName, niNumber, email, phoneNumber };
}

const { db, sql } = createTestDb();

let practiceId: string;

beforeEach(async () => {
  await clearDB(db);

  const [row] = await db
    .insert(schema.practice)
    .values({ name: 'Test Practice' })
    .returning({ id: schema.practice.id });

  practiceId = row.id;
});

afterAll(async () => {
  await sql.end();
});

describe('getClients', () => {
  describe('with a valid practiceId', () => {
    it('returns the clients', async () => {
      const client = { practiceId, ...makeClientDbRow() };
      await db.insert(schema.client).values(client).returning({ id: schema.client.id });

      const res = await getClients(practiceId, db);
      expect(res.length).toBe(1);
      expect(res[0].firstName).toBe(client.firstName);
    });
  });
  describe('with an invalid practiceId', () => {
    it('returns an empty array', async () => {
      const [rowTwo] = await db
        .insert(schema.practice)
        .values({ name: 'Test Practice' })
        .returning({ id: schema.practice.id });
      const practiceIdTwo = rowTwo.id;
      await db
        .insert(schema.client)
        .values({ practiceId: practiceId, ...makeClientDbRow() })
        .returning({ id: schema.client.id });

      const res = await getClients(practiceIdTwo, db);
      expect(res).toStrictEqual([]);
    });
  });
});

describe('getClientById', () => {
  describe('with a valid practiceId and clientId', () => {
    it('returns the client', async () => {
      const clientId = await db
        .insert(schema.client)
        .values({ practiceId, ...makeClientDbRow() })
        .returning({ id: schema.client.id });

      const res = await getClientById(practiceId, clientId[0].id, db);
      expect(res?.id).toBe(clientId[0].id);
    });
  });
  describe('when client belongs to a different practice', () => {
    it('returns null', async () => {
      const [rowTwo] = await db
        .insert(schema.practice)
        .values({ name: 'Test Practice' })
        .returning({ id: schema.practice.id });
      const practiceIdTwo = rowTwo.id;
      const clientId = await db
        .insert(schema.client)
        .values({ practiceId: practiceId, ...makeClientDbRow() })
        .returning({ id: schema.client.id });

      const res = await getClientById(practiceIdTwo, clientId[0].id, db);
      expect(res).toBe(null);
    });
  });
});

describe('insertClient', () => {
  it('returns an id', async () => {
    const res = await insertClient(practiceId, makeCreateClientInput(), db);

    expect(res.id.length).toBeGreaterThan(0);
  });

  it('with 2 clients with same niNumber and practiceId throws', async () => {
    await insertClient(practiceId, makeCreateClientInput(), db);

    await expect(async () => {
      await insertClient(practiceId, makeCreateClientInput(), db);
    }).rejects.toThrow();
  });

  it('with 2 clients with same niNumber but different practiceId succeeds', async () => {
    const [rowTwo] = await db
      .insert(schema.practice)
      .values({ name: 'Test Practice' })
      .returning({ id: schema.practice.id });
    const practiceIdTwo = rowTwo.id;

    await insertClient(practiceId, makeCreateClientInput(), db);
    const res = await insertClient(practiceIdTwo, makeCreateClientInput(), db);
    expect(res.id.length).toBeGreaterThan(0);
  });
});

describe('updateClient', () => {
  describe('with a valid client', () => {
    it('mutates the row', async () => {
      const [clientRow] = await db
        .insert(schema.client)
        .values({ practiceId, ...makeClientDbRow() })
        .returning({ id: schema.client.id });

      await updateClient(
        practiceId,
        { clientId: clientRow.id, ...makeCreateClientInput(), firstName: 'Bob' },
        db,
      );

      const res = await getClientById(practiceId, clientRow.id, db);
      expect(res?.firstName).toBe('Bob');
    });
  });
  describe('with an invalid client', () => {
    it('throws', async () => {
      await expect(
        updateClient(
          practiceId,
          { clientId: '00000000-0000-0000-0000-000000000000', ...makeCreateClientInput() },
          db,
        ),
      ).rejects.toThrow();
    });
  });
});

describe('updateClientNotes', () => {
  describe('with a valid client', () => {
    it('mutates the row', async () => {
      const [clientRow] = await db
        .insert(schema.client)
        .values({ practiceId, ...makeClientDbRow() })
        .returning({ id: schema.client.id });

      await updateClientNotes(practiceId, { clientId: clientRow.id, notes: 'Some notes' }, db);

      const res = await getClientById(practiceId, clientRow.id, db);
      expect(res?.notes).toBe('Some notes');
    });
  });
  describe('with an invalid client', () => {
    it('throws', async () => {
      await expect(
        updateClientNotes(
          practiceId,
          { clientId: '00000000-0000-0000-0000-000000000000', notes: 'Some notes' },
          db,
        ),
      ).rejects.toThrow();
    });
  });
  describe('with null', () => {
    it('clears notes', async () => {
      const [clientRow] = await db
        .insert(schema.client)
        .values({ practiceId, ...makeClientDbRow(), notes: 'Existing notes' })
        .returning({ id: schema.client.id });

      await updateClientNotes(practiceId, { clientId: clientRow.id, notes: undefined }, db);

      const res = await getClientById(practiceId, clientRow.id, db);
      expect(res?.notes).toBeNull();
    });
  });
});
