'use strict';

const pool = require('../config/database');
const identityModel = require('../models/citizenIdentityModel');
const prefModel = require('../models/notificationPrefModel');
const userIdentityModel = require('../models/userIdentityModel');
const userPrefModel = require('../models/userNotificationPrefModel');

const PROVIDER_LINE = 'line';

// Resolve a verified LINE identity → internal citizen.
// - existing identity  → return linked citizen (login)
// - first login        → create provisional citizen + identity + default prefs (Option B)
// Never merges accounts by name/displayName (PDPA — see §26).
// Returns { citizenId, isNew, isProvisional }
const resolveLineIdentity = async ({ sub, displayName, pictureUrl }) => {
  const existing = await identityModel.findByProvider(PROVIDER_LINE, sub);
  if (existing) {
    // keep display metadata fresh (UX only, fire-and-forget)
    identityModel.touchProfile(existing.id, { displayName, pictureUrl }).catch(() => {});

    const [[citizen]] = await pool.query(
      'SELECT id, is_active, is_provisional FROM citizens WHERE id = ?',
      [existing.citizen_id]
    );
    if (!citizen) throw Object.assign(new Error('linked citizen missing'), { code: 'LINE_IDENTITY_CONFLICT' });
    if (!citizen.is_active) throw Object.assign(new Error('account disabled'), { code: 'LINE_ACCOUNT_DISABLED' });

    return { citizenId: citizen.id, isNew: false, isProvisional: Boolean(citizen.is_provisional) };
  }

  // First login → provisional citizen (profile + consent completed in a later step)
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO citizens (email, password_hash, full_name, is_active, is_provisional)
       VALUES (NULL, NULL, ?, 1, 1)`,
      [displayName || 'ผู้ใช้ LINE']
    );
    const citizenId = result.insertId;
    await identityModel.create(conn, {
      citizenId, provider: PROVIDER_LINE, providerUserId: sub, displayName, pictureUrl,
    });
    await prefModel.createDefault(conn, citizenId);
    await conn.commit();
    return { citizenId, isNew: true, isProvisional: true };
  } catch (err) {
    await conn.rollback();
    // Race on UNIQUE(provider, provider_user_id) — another request created it concurrently
    if (err.code === 'ER_DUP_ENTRY') {
      const again = await identityModel.findByProvider(PROVIDER_LINE, sub);
      if (again) {
        const [[c]] = await pool.query('SELECT is_provisional FROM citizens WHERE id = ?', [again.citizen_id]);
        return { citizenId: again.citizen_id, isNew: false, isProvisional: Boolean(c?.is_provisional) };
      }
    }
    throw err;
  } finally {
    conn.release();
  }
};

// Link a verified LINE identity to an EXISTING (already authenticated) citizen.
// Never moves an identity between accounts automatically (§9 / account takeover).
const linkLineToExisting = async ({ citizenId, sub, displayName, pictureUrl }) => {
  const existing = await identityModel.findByProvider(PROVIDER_LINE, sub);
  if (existing) {
    if (existing.citizen_id === citizenId) {
      identityModel.touchProfile(existing.id, { displayName, pictureUrl }).catch(() => {});
      return { linked: true, already: true };
    }
    throw Object.assign(new Error('LINE already linked to another account'), { code: 'LINE_IDENTITY_CONFLICT' });
  }

  // one LINE identity per account — must unlink the old one first
  const own = await identityModel.findByCitizen(citizenId, PROVIDER_LINE);
  if (own) throw Object.assign(new Error('account already linked to LINE'), { code: 'LINE_ALREADY_LINKED' });

  await identityModel.create(null, { citizenId, provider: PROVIDER_LINE, providerUserId: sub, displayName, pictureUrl });
  await prefModel.createDefault(null, citizenId);
  return { linked: true };
};

const getLineIdentity = (citizenId) => identityModel.findByCitizen(citizenId, PROVIDER_LINE);

const unlinkLine = async (citizenId) => {
  const [r] = await pool.query(
    'DELETE FROM citizen_identities WHERE citizen_id = ? AND provider = ?',
    [citizenId, PROVIDER_LINE]
  );
  return r.affectedRows > 0;
};

// ── Staff (users) personal LINE link ──────────────────────────────────────────
const linkLineToUser = async ({ userId, sub, displayName, pictureUrl }) => {
  const existing = await userIdentityModel.findByProvider(PROVIDER_LINE, sub);
  if (existing) {
    if (existing.user_id === userId) {
      userIdentityModel.touchProfile(existing.id, { displayName, pictureUrl }).catch(() => {});
      return { linked: true, already: true };
    }
    throw Object.assign(new Error('LINE already linked to another staff account'), { code: 'LINE_IDENTITY_CONFLICT' });
  }
  const own = await userIdentityModel.findByUser(userId, PROVIDER_LINE);
  if (own) throw Object.assign(new Error('staff account already linked to LINE'), { code: 'LINE_ALREADY_LINKED' });

  await userIdentityModel.create(null, { userId, provider: PROVIDER_LINE, providerUserId: sub, displayName, pictureUrl });
  await userPrefModel.createDefault(null, userId);
  return { linked: true };
};

const getUserLineIdentity = (userId) => userIdentityModel.findByUser(userId, PROVIDER_LINE);
const unlinkLineUser = (userId) => userIdentityModel.deleteByUser(userId, PROVIDER_LINE);

module.exports = {
  PROVIDER_LINE, resolveLineIdentity, linkLineToExisting, getLineIdentity, unlinkLine,
  linkLineToUser, getUserLineIdentity, unlinkLineUser,
};
