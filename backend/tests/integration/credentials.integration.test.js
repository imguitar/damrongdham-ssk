import { describe, it, expect, afterEach } from 'vitest';
import citizenAuth from '../../src/controllers/citizenAuthController.js';
import authService from '../../src/services/authService.js';
import citizenModel from '../../src/models/citizenModel.js';
import { pool, dbAvailable, createCitizen, cleanupCitizen } from './_helpers.js';

const DB = await dbAvailable();

const mkRes = () => {
  const s = { statusCode: 200, body: null };
  return { status(c) { s.statusCode = c; return this; }, json(b) { s.body = b; return this; }, _s: s };
};
const nextErr = () => (err) => { if (err) throw err; };

const created = [];
const track = (id) => { created.push(id); return id; };

(DB ? describe : describe.skip)('citizen credential management (DB)', () => {
  afterEach(async () => { while (created.length) await cleanupCitizen(created.pop()); });

  it('LINE-only account: set-credentials adds email + password (enables email login)', async () => {
    const cz = track(await createCitizen()); // no email/password
    const email = `cred_${cz}@example.com`;
    const res = mkRes();
    await citizenAuth.setCredentials(
      { citizen: { id: cz }, body: { email, password: 'Secret@123' } }, res, nextErr());

    expect(res._s.body.success).toBe(true);
    expect(res._s.body.data.citizen.has_password).toBe(1);
    expect(res._s.body.data.citizen.email).toBe(email);

    // password hash usable for login
    const hash = await citizenModel.getPasswordHash(cz);
    expect(await authService.verifyPassword('Secret@123', hash)).toBe(true);
  });

  it('rejects set-credentials when a password already exists', async () => {
    const cz = track(await createCitizen());
    await citizenModel.setCredentials(cz, { email: `a_${cz}@example.com`, passwordHash: await authService.hashPassword('x123456') });
    const res = mkRes();
    await citizenAuth.setCredentials(
      { citizen: { id: cz }, body: { email: `b_${cz}@example.com`, password: 'Secret@123' } }, res, nextErr());
    expect(res._s.statusCode).toBe(400);
    expect(res._s.body.error.code).toBe('PASSWORD_ALREADY_SET');
  });

  it('rejects set-credentials with an email already in use', async () => {
    const owner = track(await createCitizen());
    const email = `dup_${owner}@example.com`;
    await citizenModel.setCredentials(owner, { email, passwordHash: await authService.hashPassword('x123456') });
    const other = track(await createCitizen());
    const res = mkRes();
    await citizenAuth.setCredentials(
      { citizen: { id: other }, body: { email, password: 'Secret@123' } }, res, nextErr());
    expect(res._s.statusCode).toBe(409);
    expect(res._s.body.error.code).toBe('EMAIL_EXISTS');
  });

  it('change-password verifies the current password', async () => {
    const cz = track(await createCitizen());
    await citizenModel.setCredentials(cz, { email: `cp_${cz}@example.com`, passwordHash: await authService.hashPassword('OldPass@1') });

    const wrong = mkRes();
    await citizenAuth.changePassword(
      { citizen: { id: cz }, body: { current_password: 'WRONG', new_password: 'NewPass@1' } }, wrong, nextErr());
    expect(wrong._s.body.error.code).toBe('INVALID_PASSWORD');

    const ok = mkRes();
    await citizenAuth.changePassword(
      { citizen: { id: cz }, body: { current_password: 'OldPass@1', new_password: 'NewPass@1' } }, ok, nextErr());
    expect(ok._s.body.success).toBe(true);
    const hash = await citizenModel.getPasswordHash(cz);
    expect(await authService.verifyPassword('NewPass@1', hash)).toBe(true);
  });

  it('findById reports has_password correctly', async () => {
    const cz = track(await createCitizen());
    expect((await citizenModel.findById(cz)).has_password).toBe(0);
    await citizenModel.setCredentials(cz, { email: `hp_${cz}@example.com`, passwordHash: await authService.hashPassword('x123456') });
    expect((await citizenModel.findById(cz)).has_password).toBe(1);
  });
});
