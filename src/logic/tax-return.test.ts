import { describe, expect, it } from 'vitest';

import type { Client, MTDTaxReturn, SA100TaxReturn } from '@/types/clients';
import { Regime, Status } from '@/types/clients';

import {
  daysTillNextDeadline,
  firstUnfiledReturn,
  formatDate,
  formatDeadline,
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
    it('returns false for not_started', () => {
      expect(isFiled(makeReturn({ status: Status.not_started }))).toBe(false);
    });
    it('returns false for in_progress', () => {
      expect(isFiled(makeReturn({ status: Status.in_progress }))).toBe(false);
    });
    it('returns false for awaiting_client', () => {
      expect(isFiled(makeReturn({ status: Status.awaiting_client }))).toBe(false);
    });
    it('returns false for ready_to_file', () => {
      expect(isFiled(makeReturn({ status: Status.ready_to_file }))).toBe(false);
    });
  });
});

describe('regimeLabel', () => {
  it('returns "SA100" for sa100', () => {
    expect(regimeLabel(makeReturn({ regime: Regime.sa100 }))).toBe('SA100');
  });
  it('returns "MTD" for mtd', () => {
    expect(regimeLabel(makeMtdReturn({ regime: Regime.mtd }))).toBe('MTD');
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

describe('formatDeadline', () => {
  it('formats date as dd/mm/yyyy in en-GB', () => {
    expect(formatDeadline(new Date('2025-03-05'))).toBe('05/03/2025');
  });
});

describe('formatDate', () => {
  it('formats date as day dd mon yyyy in en-GB', () => {
    expect(formatDate(new Date('2025-03-05'))).toBe('Wednesday, 05 Mar 2025');
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
    it('returns the highest taxYear when ordered ascending', () => {
      const earlier = makeReturn({ id: '1', taxYear: 2025 });
      const later = makeReturn({ id: '2', taxYear: 2026 });
      expect(mostRecentReturn([earlier, later])).toBe(later);
    });
    it('returns the highest taxYear when ordered descending', () => {
      const later = makeReturn({ id: '1', taxYear: 2026 });
      const earlier = makeReturn({ id: '2', taxYear: 2025 });
      expect(mostRecentReturn([later, earlier])).toBe(later);
    });
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
      const withUnfiled = makeClient({ id: '1', taxReturns: [makeReturn({ status: Status.not_started })] });
      const withAllFiled = makeClient({ id: '2', taxReturns: [makeReturn({ status: Status.filed })] });
      expect(numberOfClientsWithUnfiled([withUnfiled, withAllFiled])).toBe(1);
    });
  });
});

describe('daysTillNextDeadline', () => {
  describe('future deadline — returns positive days', () => {
    it('returns 1 for a deadline exactly one day away', () => {
      expect(daysTillNextDeadline(new Date('2025-03-06T12:00:00Z'), new Date('2025-03-05T12:00:00Z'))).toBe(1);
    });
  });
  describe('past deadline — returns negative days', () => {
    it('returns -1 for a deadline exactly one day past', () => {
      expect(daysTillNextDeadline(new Date('2025-03-04T12:00:00Z'), new Date('2025-03-05T12:00:00Z'))).toBe(-1);
    });
  });
  describe('boundary — deadline is today', () => {
    it('returns 0 for the same moment', () => {
      expect(daysTillNextDeadline(new Date('2025-03-05T12:00:00Z'), new Date('2025-03-05T12:00:00Z'))).toBe(0);
    });
  });
});
