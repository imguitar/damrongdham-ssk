import { describe, it, expect, afterEach } from 'vitest';
import identitySvc from '../../src/services/identityService.js';
import { pool, dbAvailable, createCitizen, cleanupCitizen } from './_helpers.js';

const DB = await dbAvailable();
const created = [];
const track = (id) => { created.push(id); return id; };

(DB ? describe : describe.skip)('identityService LINE linking (DB)', () => {
  afterEach(async () => { while (created.length) await cleanupCitizen(created.pop()); });

  it('links a LINE identity to an existing account', async () => {
    const cz = track(await createCitizen()); // normal email-style account (no LINE)
    const sub = `Ulink_new_${Date.now()}`;
    const r = await identitySvc.linkLineToExisting({ citizenId: cz, sub, displayName: 'x' });
    expect(r.linked).toBe(true);

    const [[idn]] = await pool.query(
      'SELECT citizen_id FROM citizen_identities WHERE provider="line" AND provider_user_id=?', [sub]);
    expect(idn.citizen_id).toBe(cz);
  });

  it('is idempotent when the same account re-links the same LINE id', async () => {
    const cz = track(await createCitizen());
    const sub = `Ulink_idem_${Date.now()}`;
    await identitySvc.linkLineToExisting({ citizenId: cz, sub });
    const r = await identitySvc.linkLineToExisting({ citizenId: cz, sub });
    expect(r.already).toBe(true);
    const [[c]] = await pool.query('SELECT COUNT(*) n FROM citizen_identities WHERE provider_user_id=?', [sub]);
    expect(c.n).toBe(1);
  });

  it('rejects linking a LINE id already owned by another account (conflict)', async () => {
    const a = track(await createCitizen());
    const b = track(await createCitizen());
    const sub = `Ulink_conf_${Date.now()}`;
    await identitySvc.linkLineToExisting({ citizenId: a, sub });
    await expect(identitySvc.linkLineToExisting({ citizenId: b, sub }))
      .rejects.toMatchObject({ code: 'LINE_IDENTITY_CONFLICT' });
  });

  it('rejects linking a second LINE id to an account that is already linked', async () => {
    const cz = track(await createCitizen());
    await identitySvc.linkLineToExisting({ citizenId: cz, sub: `Ulink_first_${Date.now()}` });
    await expect(identitySvc.linkLineToExisting({ citizenId: cz, sub: `Ulink_second_${Date.now()}` }))
      .rejects.toMatchObject({ code: 'LINE_ALREADY_LINKED' });
  });

  it('getLineIdentity + unlinkLine round-trip', async () => {
    const cz = track(await createCitizen());
    await identitySvc.linkLineToExisting({ citizenId: cz, sub: `Ulink_unlink_${Date.now()}` });
    expect(await identitySvc.getLineIdentity(cz)).toBeTruthy();

    expect(await identitySvc.unlinkLine(cz)).toBe(true);
    expect(await identitySvc.getLineIdentity(cz)).toBeFalsy();
    expect(await identitySvc.unlinkLine(cz)).toBe(false); // nothing to remove
  });
});
