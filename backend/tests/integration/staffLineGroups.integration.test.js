import { describe, it, expect, afterEach, vi } from 'vitest';
import gm from '../../src/models/lineGroupModel.js';
import wh from '../../src/services/lineWebhookService.js';
import { pool, dbAvailable } from './_helpers.js';

const DB = await dbAvailable();

const agencyId = async () => (await pool.query('SELECT id FROM agencies WHERE is_center=0 AND is_active=1 LIMIT 1'))[0][0].id;
const userId = async () => (await pool.query('SELECT id FROM users LIMIT 1'))[0][0].id;

const codes = [];
const groups = [];
const mkCode = async ({ scope = 'agency', ag, minutes = 10 }) => {
  const code = `IT${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
  await gm.createPairingCode({ code, scope, agencyId: ag, label: 'itest', createdBy: await userId(), expiresAt: new Date(Date.now() + minutes * 60000) });
  codes.push(code);
  return code;
};

(DB ? describe : describe.skip)('staff LINE group binding (DB)', () => {
  afterEach(async () => {
    vi.unstubAllGlobals();
    while (groups.length) await pool.query('DELETE FROM line_group_targets WHERE group_id=?', [groups.pop()]);
    while (codes.length) await pool.query('DELETE FROM line_group_pairing_codes WHERE code=?', [codes.pop()]);
  });

  it('binds a group when a valid pairing code is posted', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200 }))); // stub reply API
    const ag = await agencyId();
    const code = await mkCode({ scope: 'agency', ag });
    const groupId = `Cg_${Date.now()}`; groups.push(groupId);

    await wh.handleEvent({ type: 'message', source: { type: 'group', groupId }, message: { type: 'text', text: code }, replyToken: 'rt' });

    const t = await gm.findTargetByGroup(groupId);
    expect(t).toBeTruthy();
    expect(t.scope).toBe('agency');
    expect(t.agency_id).toBe(ag);
    expect(t.is_active).toBe(1);
    expect(await gm.findValidPairingCode(code)).toBeNull(); // consumed
  });

  it('ignores an expired pairing code', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200 })));
    const ag = await agencyId();
    const code = await mkCode({ scope: 'agency', ag, minutes: -1 }); // already expired
    const groupId = `Cg_exp_${Date.now()}`;

    await wh.handleEvent({ type: 'message', source: { type: 'group', groupId }, message: { type: 'text', text: code }, replyToken: 'rt' });
    expect(await gm.findTargetByGroup(groupId)).toBeNull();
  });

  it('disables the target when the bot leaves the group', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200 })));
    const ag = await agencyId();
    const code = await mkCode({ scope: 'agency', ag });
    const groupId = `Cg_leave_${Date.now()}`; groups.push(groupId);
    await wh.handleEvent({ type: 'message', source: { type: 'group', groupId }, message: { type: 'text', text: code }, replyToken: 'rt' });

    await wh.handleEvent({ type: 'leave', source: { type: 'group', groupId } });
    expect((await gm.findTargetByGroup(groupId)).is_active).toBe(0);
  });

  it('updateTarget only applies whitelisted toggle columns', async () => {
    const ag = await agencyId();
    const t = await gm.upsertTarget({ scope: 'agency', agencyId: ag, groupId: `Cg_upd_${Date.now()}`, label: 'x', boundBy: await userId() });
    groups.push(t.group_id);
    await gm.updateTarget(t.id, { notify_sla: 0, group_id: 'HACKED', id: 999 });
    const after = await gm.getTargetById(t.id);
    expect(after.notify_sla).toBe(0);
    expect(after.group_id).toBe(t.group_id); // injected field ignored
  });
});
