'use strict';

const pool = require('../config/database');
const identityModel = require('../models/citizenIdentityModel');
const prefModel = require('../models/notificationPrefModel');

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

module.exports = { PROVIDER_LINE, resolveLineIdentity };
