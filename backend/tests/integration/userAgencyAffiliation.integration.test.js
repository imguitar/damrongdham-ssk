import { describe, it, expect } from 'vitest';
import userModel from '../../src/models/userModel.js';
import { dbAvailable } from './_helpers.js';

const DB = await dbAvailable();

(DB ? describe : describe.skip)('staff agency affiliations', () => {
  it('returns the center agency for seeded center staff', async () => {
    for (const username of ['admin', 'officer1', 'chief1']) {
      const user = await userModel.findByUsername(username);
      expect(user.agency_name).toBe('ศูนย์ดำรงธรรมจังหวัดศรีสะเกษ');
      expect(user.agency_is_center).toBe(1);
    }
  });

  it('returns the destination agency for seeded agency staff', async () => {
    for (const username of ['agency1', 'test_agency_off', 'test_agency_head']) {
      const user = await userModel.findByUsername(username);
      expect(user.agency_name).toBe('สำนักงานที่ดินจังหวัดศรีสะเกษ');
      expect(user.agency_is_center).toBe(0);
    }
  });

  it('keeps the executive account unaffiliated', async () => {
    const user = await userModel.findByUsername('test_exec');
    expect(user.agency_id).toBeNull();
    expect(user.agency_name).toBeNull();
  });
});
