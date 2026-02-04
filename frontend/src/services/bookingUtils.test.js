import { describe, it, expect } from 'vitest';
import {
  checkPeakHour,
  calculateDuration,
  calculateSurcharge,
  calculateReferralDiscount,
  calculateTotalAmount
} from './bookingUtils';

describe('checkPeakHour', () => {
  it('returns true for 8 AM', () => {
    const date = new Date('2024-01-15T08:00:00');
    expect(checkPeakHour(date)).toBe(true);
  });

  it('returns true for 9 AM', () => {
    const date = new Date('2024-01-15T09:30:00');
    expect(checkPeakHour(date)).toBe(true);
  });

  it('returns false for 10 AM (end of peak)', () => {
    const date = new Date('2024-01-15T10:00:00');
    expect(checkPeakHour(date)).toBe(false);
  });

  it('returns false for 7 AM (before peak)', () => {
    const date = new Date('2024-01-15T07:59:00');
    expect(checkPeakHour(date)).toBe(false);
  });

  it('returns false for afternoon', () => {
    const date = new Date('2024-01-15T14:00:00');
    expect(checkPeakHour(date)).toBe(false);
  });
});

describe('calculateDuration', () => {
  it('calculates 1 hour correctly', () => {
    const start = '2024-01-15T10:00:00';
    const end = '2024-01-15T11:00:00';
    expect(calculateDuration(start, end)).toBe(1);
  });

  it('calculates 3 hours correctly', () => {
    const start = '2024-01-15T09:00:00';
    const end = '2024-01-15T12:00:00';
    expect(calculateDuration(start, end)).toBe(3);
  });

  it('rounds up partial hours', () => {
    const start = '2024-01-15T10:00:00';
    const end = '2024-01-15T11:30:00';
    expect(calculateDuration(start, end)).toBe(2);
  });

  it('rounds up 1 minute to 1 hour', () => {
    const start = '2024-01-15T10:00:00';
    const end = '2024-01-15T10:01:00';
    expect(calculateDuration(start, end)).toBe(1);
  });
});

describe('calculateSurcharge', () => {
  it('returns 10% surcharge during peak hour', () => {
    expect(calculateSurcharge(100, true)).toBe(10);
  });

  it('returns 0 surcharge outside peak hour', () => {
    expect(calculateSurcharge(100, false)).toBe(0);
  });

  it('rounds surcharge to nearest integer', () => {
    expect(calculateSurcharge(55, true)).toBe(6);
  });
});

describe('calculateReferralDiscount', () => {
  it('returns 5% discount', () => {
    expect(calculateReferralDiscount(100)).toBe(5);
  });

  it('rounds discount to nearest integer', () => {
    expect(calculateReferralDiscount(33)).toBe(2);
  });
});

describe('calculateTotalAmount', () => {
  it('calculates base amount without surcharge or discount', () => {
    const total = calculateTotalAmount(2, 50, false, false);
    expect(total).toBe(100);
  });

  it('adds 10% surcharge during peak hour', () => {
    const total = calculateTotalAmount(2, 50, true, false);
    expect(total).toBe(110);
  });

  it('applies 5% referral discount', () => {
    const total = calculateTotalAmount(2, 50, false, true);
    expect(total).toBe(95);
  });

  it('applies both surcharge and discount correctly', () => {
    // Base: 2 * 50 = 100
    // Surcharge: 100 * 0.10 = 10
    // Total before discount: 110
    // Discount: 110 * 0.05 = 5.5 -> 6 (rounded)
    // Final: 110 - 6 = 104
    const total = calculateTotalAmount(2, 50, true, true);
    expect(total).toBe(104);
  });
});
