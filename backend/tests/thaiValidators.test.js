import { describe, it, expect } from 'vitest';
import v from '../src/utils/thaiValidators.js';

const { isValidThaiIdCard, isValidThaiPhone, digitsOnly } = v;

describe('isValidThaiIdCard', () => {
  it('accepts a 13-digit id with a correct check digit', () => {
    expect(isValidThaiIdCard('1101700230708')).toBe(true);
    expect(isValidThaiIdCard('1-1017-00230-70-8')).toBe(true);
  });
  it('rejects a wrong check digit, wrong length or non-digits', () => {
    expect(isValidThaiIdCard('1101700230705')).toBe(false);
    expect(isValidThaiIdCard('110170023070')).toBe(false);
    expect(isValidThaiIdCard('')).toBe(false);
    expect(isValidThaiIdCard(null)).toBe(false);
  });
});

describe('isValidThaiPhone', () => {
  it('accepts mobile and landline numbers', () => {
    expect(isValidThaiPhone('0812345678')).toBe(true);
    expect(isValidThaiPhone('045-123456')).toBe(true);
  });
  it('rejects numbers not starting with 0 or with a wrong length', () => {
    expect(isValidThaiPhone('812345678')).toBe(false);
    expect(isValidThaiPhone('08123')).toBe(false);
    expect(isValidThaiPhone('081234567890')).toBe(false);
  });
});

describe('digitsOnly', () => {
  it('strips separators', () => expect(digitsOnly('081-234 5678')).toBe('0812345678'));
});
