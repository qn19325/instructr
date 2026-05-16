import { describe, it, expect } from 'vitest';

import { currentTaxYear } from './tax-year';

describe('currentTaxYear', () => {
  describe('January-March — old tax year', () => {
    it('returns previous year for January 15', () => {
      expect(currentTaxYear(new Date('2026-01-15'))).toBe(2025);
    });
  });

  describe('April 1-5 — old tax year', () => {
    it('returns previous year for April 4', () => {
      expect(currentTaxYear(new Date('2026-04-04'))).toBe(2025);
    });
  });

  describe('April 6 onwards — current tax year', () => {
    it('returns current year for April 7', () => {
      expect(currentTaxYear(new Date('2026-04-07'))).toBe(2026);
    });
  });

  describe('April 5 / April 6 boundary', () => {
    it('returns previous year for April 5', () => {
      expect(currentTaxYear(new Date('2026-04-05'))).toBe(2025);
    });
    it('returns current year for April 6', () => {
      expect(currentTaxYear(new Date('2026-04-06'))).toBe(2026);
    });
  });
});
