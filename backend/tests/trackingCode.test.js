import { describe, it, expect } from 'vitest';
import tc from '../src/utils/trackingCode.js';

const { ALPHABET, LENGTH, generateTrackingCode, normalizeTrackingCode, isTrackingCodeConflict } = tc;

describe('generateTrackingCode', () => {
  it('returns 4 characters from the unambiguous alphabet', () => {
    for (let i = 0; i < 500; i += 1) {
      const code = generateTrackingCode();
      expect(code).toHaveLength(LENGTH);
      for (const ch of code) expect(ALPHABET).toContain(ch);
    }
  });

  it('excludes look-alike characters', () => {
    for (const ch of ['0', 'O', '1', 'I', 'L']) expect(ALPHABET).not.toContain(ch);
  });

  it('is not sequential — consecutive codes are spread out', () => {
    const codes = new Set(Array.from({ length: 200 }, generateTrackingCode));
    expect(codes.size).toBeGreaterThan(190);
  });
});

describe('normalizeTrackingCode', () => {
  it('uppercases and strips spaces/dashes', () => {
    expect(normalizeTrackingCode(' k7-p3 ')).toBe('K7P3');
  });
  it('rejects wrong length or characters outside the alphabet', () => {
    expect(normalizeTrackingCode('K7P')).toBeNull();
    expect(normalizeTrackingCode('K7P3X')).toBeNull();
    expect(normalizeTrackingCode('K0P3')).toBeNull();
    expect(normalizeTrackingCode('DC-202608-0001')).toBeNull();
    expect(normalizeTrackingCode(undefined)).toBeNull();
  });
});

describe('isTrackingCodeConflict', () => {
  it('only matches duplicate-key errors on the tracking code index', () => {
    expect(isTrackingCodeConflict({ code: 'ER_DUP_ENTRY', message: "Duplicate entry 'K7P3' for key 'complaints.uq_complaints_tracking_code'" })).toBe(true);
    expect(isTrackingCodeConflict({ code: 'ER_DUP_ENTRY', message: "for key 'complaints.uq_complaints_number'" })).toBe(false);
    expect(isTrackingCodeConflict(new Error('boom'))).toBe(false);
  });
});
