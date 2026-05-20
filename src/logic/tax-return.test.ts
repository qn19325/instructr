import { describe, expect, it } from 'vitest';

import type { Client, MTDTaxReturn, SA100TaxReturn } from '@/types/clients';
import { Regime, Status } from '@/types/clients';

import {
  daysTillNextDeadline,
  firstUnfiledReturn,
  formatDate,
  isFiled,
  mostRecentReturn,
  numberOfClientsWithUnfiled,
  regimeLabel,
} from './tax-return';

function makeReturn(overrides: Partial<SA100TaxReturn> = {}): SA100TaxReturn {
  return {
    id: '1',
    taxYear: 2024,
    checklist: [],
    regime: Regime.sa100,
    status: Status.not_started,
    ...overrides,
  };
}

function makeMtdReturn(overrides: Partial<MTDTaxReturn> = {}): MTDTaxReturn {
  return {
    id: '1',
    taxYear: 2024,
    checklist: [],
    regime: Regime.mtd,
    status: Status.not_started,
    submissions: [],
    ...overrides,
  };
}

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: '1',
    niNumber: 'AB 12 34 56 C',
    firstName: 'Jane',
    lastName: 'Smith',
    email: null,
    phoneNumber: null,
    notes: null,
    taxReturns: [],
    ...overrides,
  };
}

describe('isFiled', () => {
  describe('status is filed', () => {
    it('returns true', () => {
      expect(isFiled(makeReturn({ status: Status.filed }))).toBe(true);
    });
  });
  describe('status is not filed', () => {
    const unfiledStatuses = Object.values(Status).filter((s) => s !== Status.filed);
    it.each(unfiledStatuses)('returns false for %s', (status) => {
      expect(isFiled(makeReturn({ status }))).toBe(false);
    });
  });
});

describe('regimeLabel', () => {
  describe('sa100 regime', () => {
    it('returns "SA100"', () => {
      expect(regimeLabel(makeReturn({ regime: Regime.sa100 }))).toBe('SA100');
    });
  });
  describe('mtd regime', () => {
    it('returns "MTD"', () => {
      expect(regimeLabel(makeMtdReturn({ regime: Regime.mtd }))).toBe('MTD');
    });
  });
});

describe('firstUnfiledReturn', () => {
  describe('empty array', () => {
    it('returns undefined', () => {
      expect(firstUnfiledReturn([])).toBe(undefined);
    });
  });
  describe('all returns filed', () => {
    it('returns undefined', () => {
      expect(firstUnfiledReturn([makeReturn({ status: Status.filed })])).toBe(undefined);
    });
  });
  describe('at least one unfiled return', () => {
    it('returns the first unfiled return', () => {
      const first = makeReturn({ id: '1', status: Status.not_started });
      const second = makeReturn({ id: '2', status: Status.in_progress });
      expect(firstUnfiledReturn([first, second])).toBe(first);
    });
  });
});

describe('formatDate', () => {
  describe('standard date', () => {
    it('formats as weekday dd Mon yyyy in en-GB', () => {
      expect(formatDate(new Date(Date.UTC(2025, 2, 5)))).toEqual('Wednesday, 05 Mar 2025');
    });
  });
});

describe('mostRecentReturn', () => {
  describe('empty array', () => {
    it('returns undefined', () => {
      expect(mostRecentReturn([])).toBe(undefined);
    });
  });
  describe('single element', () => {
    it('returns that element', () => {
      const r = makeReturn({ taxYear: 2025 });
      expect(mostRecentReturn([r])).toBe(r);
    });
  });
  describe('multiple elements', () => {
    it.each(['ascending', 'descending'] as const)(
      'returns the highest taxYear when ordered %s',
      (order) => {
        const earlier = makeReturn({ id: '1', taxYear: 2025 });
        const later = makeReturn({ id: '2', taxYear: 2026 });
        const input = order === 'ascending' ? [earlier, later] : [later, earlier];
        expect(mostRecentReturn(input)).toBe(later);
      },
    );
  });
});

describe('numberOfClientsWithUnfiled', () => {
  describe('empty array', () => {
    it('returns 0', () => {
      expect(numberOfClientsWithUnfiled([])).toBe(0);
    });
  });
  describe('all clients have all returns filed', () => {
    it('returns 0', () => {
      const client = makeClient({ taxReturns: [makeReturn({ status: Status.filed })] });
      expect(numberOfClientsWithUnfiled([client])).toBe(0);
    });
  });
  describe('some clients have unfiled returns', () => {
    it('returns the count of clients with at least one unfiled return', () => {
      const withUnfiled = makeClient({
        id: '1',
        taxReturns: [makeReturn({ status: Status.not_started })],
      });
      const withAllFiled = makeClient({
        id: '2',
        taxReturns: [makeReturn({ status: Status.filed })],
      });
      expect(numberOfClientsWithUnfiled([withUnfiled, withAllFiled])).toBe(1);
    });
  });
});

describe('daysTillNextDeadline', () => {
  it.each([
    {
      label: 'one day in the future',
      deadline: '2025-03-06T12:00:00Z',
      now: '2025-03-05T12:00:00Z',
      expected: 1,
    },
    {
      label: 'one day in the past',
      deadline: '2025-03-04T12:00:00Z',
      now: '2025-03-05T12:00:00Z',
      expected: -1,
    },
    {
      label: 'the same moment',
      deadline: '2025-03-05T12:00:00Z',
      now: '2025-03-05T12:00:00Z',
      expected: 0,
    },
  ])('returns $expected when the deadline is $label', ({ deadline, now, expected }) => {
    expect(daysTillNextDeadline(new Date(deadline), new Date(now))).toBe(expected);
  });
});
