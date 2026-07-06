import { describe, it, expect } from 'vitest';
import job from '../src/jobs/notificationOutboxJob.js';

const { isEnabled, EVENT_PREF_MAP } = job;

describe('notificationOutboxJob.isEnabled', () => {
  it('defaults to enabled when no preference row exists', () => {
    expect(isEnabled(null, 'COMPLAINT_STATUS_CHANGED')).toBe(true);
    expect(isEnabled(undefined, 'COMPLAINT_CLOSED')).toBe(true);
  });

  it('disables everything when line_enabled is off', () => {
    const pref = { line_enabled: 0, notify_status_change: 1 };
    expect(isEnabled(pref, 'COMPLAINT_STATUS_CHANGED')).toBe(false);
  });

  it('respects the per-event toggle', () => {
    const pref = {
      line_enabled: 1,
      notify_status_change: 0,
      notify_progress_update: 1,
      notify_closed: 1,
    };
    expect(isEnabled(pref, 'COMPLAINT_STATUS_CHANGED')).toBe(false);
    expect(isEnabled(pref, 'COMPLAINT_PROGRESS_UPDATED')).toBe(true);
    expect(isEnabled(pref, 'COMPLAINT_CLOSED')).toBe(true);
  });

  it('maps each event type to a preference column', () => {
    expect(EVENT_PREF_MAP.COMPLAINT_STATUS_CHANGED).toBe('notify_status_change');
    expect(EVENT_PREF_MAP.COMPLAINT_CLOSED).toBe('notify_closed');
    expect(EVENT_PREF_MAP.COMPLAINT_PROGRESS_UPDATED).toBe('notify_progress_update');
    expect(EVENT_PREF_MAP.COMPLAINT_RESOLVED).toBe('notify_resolved');
    expect(EVENT_PREF_MAP.COMPLAINT_MORE_INFO_REQUIRED).toBe('notify_more_info_required');
  });
});
