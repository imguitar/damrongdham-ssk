import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import identitySvc from '../../src/services/identityService.js';
import prefModel from '../../src/models/notificationPrefModel.js';
import { pool, dbAvailable, cleanupCitizen } from './_helpers.js';

const DB = await dbAvailable();
const created = [];
const track = (id) => { created.push(id); return id; };

(DB ? describe : describe.skip)('identityService.resolveLineIdentity (DB)', () => {
  afterEach(async () => { while (created.length) await cleanupCitizen(created.pop()); });

  it('first login creates a provisional citizen + identity + default preferences', async () => {
    const sub = `Uint_new_${Date.now()}`;
    const r = await identitySvc.resolveLineIdentity({ sub, displayName: 'ทดสอบ', pictureUrl: null });
    track(r.citizenId);

    expect(r.isNew).toBe(true);
    expect(r.isProvisional).toBe(true);

    const [[citizen]] = await pool.query('SELECT is_provisional FROM citizens WHERE id = ?', [r.citizenId]);
    expect(citizen.is_provisional).toBe(1);

    const [[identity]] = await pool.query(
      'SELECT citizen_id FROM citizen_identities WHERE provider="line" AND provider_user_id=?', [sub]);
    expect(identity.citizen_id).toBe(r.citizenId);

    const pref = await prefModel.getByCitizen(r.citizenId);
    expect(pref).toBeTruthy();
    expect(pref.line_enabled).toBe(1);
  });

  it('returning login maps to the SAME citizen (no duplicate)', async () => {
    const sub = `Uint_same_${Date.now()}`;
    const first = await identitySvc.resolveLineIdentity({ sub, displayName: 'a' });
    track(first.citizenId);
    const second = await identitySvc.resolveLineIdentity({ sub, displayName: 'a again' });

    expect(second.isNew).toBe(false);
    expect(second.citizenId).toBe(first.citizenId);

    const [[cnt]] = await pool.query(
      'SELECT COUNT(*) n FROM citizen_identities WHERE provider="line" AND provider_user_id=?', [sub]);
    expect(cnt.n).toBe(1);
  });

  it('rejects login for a disabled account', async () => {
    const sub = `Uint_disabled_${Date.now()}`;
    const r = await identitySvc.resolveLineIdentity({ sub });
    track(r.citizenId);
    await pool.query('UPDATE citizens SET is_active=0 WHERE id=?', [r.citizenId]);

    await expect(identitySvc.resolveLineIdentity({ sub }))
      .rejects.toMatchObject({ code: 'LINE_ACCOUNT_DISABLED' });
  });
});
