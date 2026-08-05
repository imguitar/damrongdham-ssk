import { describe, it, expect } from 'vitest';
import ctrl from '../../src/controllers/lineAuthController.js';

// cookie ที่เก็บ OAuth state ต้องถูกส่งกลับมาที่ callback เสมอ
// เมื่อ deploy ใต้ subpath (Target B: https://host/damrongdham-ssk/api/...)
// เบราว์เซอร์เทียบ path ของ cookie กับ path เต็มที่รวม prefix → cookie path ต้องรวม
// prefix ด้วย ไม่งั้น callback จะไม่ได้รับ cookie แล้วเด้งกลับด้วย line_invalid_state

const CALLBACK = (prefix) => `${prefix}/api/citizen/auth/line/callback`;

describe('OAuth state cookie path', () => {
  it('deploy ที่ root → path เดิม (ไม่มี prefix)', () => {
    expect(ctrl.cookiePathFor('https://damrongdham.example.go.th')).toBe('/api/citizen/auth/line');
  });

  it('deploy ใต้ subpath → cookie path รวม subpath และครอบคลุม callback', () => {
    const path = ctrl.cookiePathFor('https://www.example.com/damrongdham-ssk');
    expect(path).toBe('/damrongdham-ssk/api/citizen/auth/line');
    // เบราว์เซอร์ส่ง cookie เมื่อ path ของ request ขึ้นต้นด้วย cookie path
    expect(CALLBACK('/damrongdham-ssk').startsWith(path)).toBe(true);
  });

  it('path เดิม (ไม่รวม subpath) จะไม่ครอบคลุม callback — ยืนยันว่าบั๊กเดิมมีจริง', () => {
    expect(CALLBACK('/damrongdham-ssk').startsWith('/api/citizen/auth/line')).toBe(false);
  });

  it('BACKEND_URL มี / ปิดท้าย → ไม่เกิด path ซ้อน //', () => {
    expect(ctrl.cookiePathFor('https://www.example.com/damrongdham-ssk/'))
      .toBe('/damrongdham-ssk/api/citizen/auth/line');
  });

  it('subpath ซ้อนหลายชั้นก็รองรับ', () => {
    expect(ctrl.cookiePathFor('https://www.example.com/apps/damrongdham-ssk'))
      .toBe('/apps/damrongdham-ssk/api/citizen/auth/line');
  });

  it('BACKEND_URL ไม่ถูกต้อง/ว่าง → fallback เป็น path เดิม (ไม่ทำให้ login พัง)', () => {
    expect(ctrl.cookiePathFor('not-a-url')).toBe('/api/citizen/auth/line');
    expect(ctrl.cookiePathFor('')).toBe('/api/citizen/auth/line');
  });

  it('localhost dev (ค่าใน vitest.config) → path เดิม', () => {
    expect(ctrl.cookiePath()).toBe('/api/citizen/auth/line');
  });
});
