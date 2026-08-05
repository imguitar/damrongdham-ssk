import { describe, it, expect, afterEach } from 'vitest';
import messaging from '../src/services/lineMessagingService.js';

// ผูกบัญชี LINE แล้วยังไม่พอ — ถ้าไม่ได้เพิ่ม OA เป็นเพื่อน push จะส่งไม่ถึง (LINE 403)
// LINE profile API คืน 404 เมื่อยังไม่เป็นเพื่อน จึงใช้ตรวจสถานะล่วงหน้าได้
// stub global.fetch (source เป็น CJS จึง mock ตัว service ตรง ๆ ไม่ได้)

const realFetch = global.fetch;

const stub = (handler) => { global.fetch = handler; };
const jsonResp = (status, body = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
  text: async () => JSON.stringify(body),
  headers: { get: () => null },
});

afterEach(() => { global.fetch = realFetch; });

describe('ตรวจสถานะการเป็นเพื่อนกับ OA', () => {
  it('200 → เป็นเพื่อน (ส่งข้อความได้) พร้อมชื่อที่แสดง', async () => {
    stub(async () => jsonResp(200, { displayName: 'สมชาย', pictureUrl: 'https://x/y.jpg' }));
    const res = await messaging.getFriendshipStatus('U123');
    expect(res.friend).toBe(true);
    expect(res.displayName).toBe('สมชาย');
  });

  it('404 → ยังไม่ได้เพิ่มเพื่อน/บล็อกไว้ (ส่งไม่ถึง)', async () => {
    stub(async () => jsonResp(404, { message: 'Not found' }));
    const res = await messaging.getFriendshipStatus('U123');
    expect(res.friend).toBe(false);
    expect(res.reason).toBe('not_friend');
  });

  it('500 → ตรวจไม่ได้ ต้องคืน null (ห้ามสรุปว่าไม่เป็นเพื่อน)', async () => {
    stub(async () => jsonResp(500));
    expect((await messaging.getFriendshipStatus('U123')).friend).toBeNull();
  });

  it('เครือข่ายล่ม → null และไม่ throw', async () => {
    stub(async () => { throw new Error('network down'); });
    expect((await messaging.getFriendshipStatus('U123')).friend).toBeNull();
  });

  it('ไม่ได้ส่ง userId → null', async () => {
    expect((await messaging.getFriendshipStatus('')).friend).toBeNull();
  });

  it('getProfile ยังทำงานเหมือนเดิม (คืน null เมื่อไม่เป็นเพื่อน)', async () => {
    stub(async () => jsonResp(404));
    expect(await messaging.getProfile('U123')).toBeNull();

    stub(async () => jsonResp(200, { displayName: 'ก' }));
    expect(await messaging.getProfile('U123')).toEqual({ displayName: 'ก', pictureUrl: null });
  });

  it('userId ถูก encode ก่อนใส่ใน URL (กัน path injection)', async () => {
    let called = '';
    stub(async (url) => { called = String(url); return jsonResp(200, {}); });
    await messaging.getFriendshipStatus('U1/../../evil');
    expect(called).toContain('U1%2F..%2F..%2Fevil');
  });
});

describe('ลิงก์เพิ่มเพื่อน OA', () => {
  it('สร้างลิงก์จาก basicId ที่ดึงมาจาก LINE', async () => {
    stub(async (url) => (String(url).includes('/v2/bot/info')
      ? jsonResp(200, { basicId: '@123abcde', displayName: 'ศูนย์ดำรงธรรม' })
      : jsonResp(404)));
    expect(await messaging.addFriendUrl()).toBe('https://line.me/R/ti/p/@123abcde');
  });

  it('cache ผลไว้ ไม่ยิง LINE ซ้ำทุกครั้ง', async () => {
    let calls = 0;
    stub(async () => { calls += 1; return jsonResp(200, { basicId: '@cached01' }); });
    await messaging.addFriendUrl();
    const before = calls;
    await messaging.addFriendUrl();
    expect(calls).toBe(before); // ครั้งที่สองใช้ cache
  });
});
