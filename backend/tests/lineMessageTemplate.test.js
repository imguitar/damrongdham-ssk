import { describe, it, expect } from 'vitest';
import tpl from '../src/utils/lineMessageTemplate.js';

const REF = 'SSK-2569-000123';

describe('lineMessageTemplate', () => {
  it('status message contains reference, Thai status label, and detail URL', () => {
    const msg = tpl.buildComplaintStatusMessage({ complaintNumber: REF, status: 'IN_PROGRESS' });
    expect(msg).toContain(REF);
    expect(msg).toContain('อยู่ระหว่างดำเนินการ');
    expect(msg).toContain(`/citizen/complaints/${REF}`);
    expect(msg).not.toContain('undefined');
  });

  it('is privacy-safe: no sensitive field labels in output', () => {
    const msg = tpl.buildComplaintStatusMessage({ complaintNumber: REF, status: 'CLOSED' });
    // template only receives ref + status, so PII can never leak in
    for (const forbidden of ['บัตรประชาชน', 'เลขบัตร', 'id_card', 'internal', 'ผู้ถูกร้อง']) {
      expect(msg).not.toContain(forbidden);
    }
  });

  it('buildByEvent maps every supported event to a message', () => {
    const events = [
      'COMPLAINT_STATUS_CHANGED',
      'COMPLAINT_PROGRESS_UPDATED',
      'COMPLAINT_MORE_INFO_REQUIRED',
      'COMPLAINT_RESOLVED',
      'COMPLAINT_CLOSED',
    ];
    for (const ev of events) {
      const msg = tpl.buildByEvent(ev, { complaintNumber: REF, status: 'NEW' });
      expect(typeof msg).toBe('string');
      expect(msg).toContain(REF);
    }
  });

  it('buildByEvent returns null for unknown events', () => {
    expect(tpl.buildByEvent('SOMETHING_ELSE', { complaintNumber: REF })).toBeNull();
  });

  it('statusLabel falls back to the raw code when unknown', () => {
    expect(tpl.statusLabel('IN_PROGRESS')).toBe('อยู่ระหว่างดำเนินการ');
    expect(tpl.statusLabel('WEIRD')).toBe('WEIRD');
  });
});
