import { describe, it, expect } from 'vitest';
import tpl from '../src/utils/lineMessageTemplate.js';

const REF = 'K7P3';

describe('lineMessageTemplate', () => {
  it('status message contains reference, Thai status label, and detail URL', () => {
    const msg = tpl.buildComplaintStatusMessage({ trackingCode: REF, status: 'IN_PROGRESS' });
    expect(msg).toContain(REF);
    expect(msg).toContain('อยู่ระหว่างดำเนินการ');
    expect(msg).toContain(`/citizen/complaints/${REF}`);
    expect(msg).not.toContain('undefined');
  });

  it('is privacy-safe: no sensitive field labels in output', () => {
    const msg = tpl.buildComplaintStatusMessage({ trackingCode: REF, status: 'CLOSED' });
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
      'COMPLAINT_CUSTOM_MESSAGE',
    ];
    for (const ev of events) {
      const msg = tpl.buildByEvent(ev, { trackingCode: REF, status: 'NEW' });
      expect(typeof msg).toBe('string');
      expect(msg).toContain(REF);
    }
  });

  it('buildByEvent returns null for unknown events', () => {
    expect(tpl.buildByEvent('SOMETHING_ELSE', { trackingCode: REF })).toBeNull();
  });

  it('statusLabel falls back to the raw code when unknown', () => {
    expect(tpl.statusLabel('IN_PROGRESS')).toBe('อยู่ระหว่างดำเนินการ');
    expect(tpl.statusLabel('WEIRD')).toBe('WEIRD');
  });

  it('custom message contains the staff text, reference, and authenticated detail URL', () => {
    const msg = tpl.buildComplaintCustomMessage({
      trackingCode: REF,
      customMessage: 'กรุณาติดต่อเจ้าหน้าที่กลับภายในเวลาราชการ',
    });
    expect(msg).toContain('ข้อความจากศูนย์ดำรงธรรม');
    expect(msg).toContain('กรุณาติดต่อเจ้าหน้าที่กลับภายในเวลาราชการ');
    expect(msg).toContain(REF);
    expect(msg).toContain(`/citizen/complaints/${REF}`);
  });

  it('custom message template defensively limits the staff-entered text to 1,000 characters', () => {
    const msg = tpl.buildComplaintCustomMessage({ trackingCode: REF, customMessage: 'ก'.repeat(1001) });
    expect(msg).toContain('ก'.repeat(1000));
    expect(msg).not.toContain('ก'.repeat(1001));
  });
});
