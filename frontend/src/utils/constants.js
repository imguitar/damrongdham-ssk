export const COMPLAINT_STATUS = {
  NEW:         'NEW',
  SCREENING:   'SCREENING',
  ASSIGNED:    'ASSIGNED',
  ACCEPTED:    'ACCEPTED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED:    'RESOLVED',
  REVIEWING:   'REVIEWING',
  CLOSED:      'CLOSED',
  REJECTED:    'REJECTED',
  RETURNED:    'RETURNED',
};

export const STATUS_LABELS = {
  NEW:         'ใหม่',
  SCREENING:   'กำลังคัดกรอง',
  ASSIGNED:    'ส่งต่อแล้ว',
  ACCEPTED:    'รับเรื่องแล้ว',
  IN_PROGRESS: 'กำลังดำเนินการ',
  RESOLVED:    'ส่งผลแล้ว',
  REVIEWING:   'กำลังตรวจผล',
  CLOSED:      'ปิดเรื่อง',
  REJECTED:    'ปฏิเสธ',
  RETURNED:    'ส่งคืน',
};

export const STATUS_COLORS = {
  NEW:         'default',
  SCREENING:   'info',
  ASSIGNED:    'primary',
  ACCEPTED:    'primary',
  IN_PROGRESS: 'warning',
  RESOLVED:    'success',
  REVIEWING:   'secondary',
  CLOSED:      'success',
  REJECTED:    'error',
  RETURNED:    'warning',
};

export const PRIORITY = {
  LOW:      'LOW',
  MEDIUM:   'MEDIUM',
  HIGH:     'HIGH',
  CRITICAL: 'CRITICAL',
};

export const PRIORITY_LABELS = {
  LOW:      'ต่ำ',
  MEDIUM:   'ปานกลาง',
  HIGH:     'สูง',
  CRITICAL: 'วิกฤต',
};

export const PRIORITY_COLORS = {
  LOW:      'default',
  MEDIUM:   'info',
  HIGH:     'warning',
  CRITICAL: 'error',
};

export const ROLES = {
  SUPER_ADMIN:    'super_admin',
  ADMIN:          'admin',
  OFFICER:        'officer',
  CHIEF:          'chief',
  AGENCY_HEAD:    'agency_head',
  AGENCY_OFFICER: 'agency_officer',
  EXECUTIVE:      'executive',
};

export const ROLE_LABELS = {
  super_admin:    'ผู้ดูแลระบบสูงสุด',
  admin:          'ผู้ดูแลระบบ',
  officer:        'เจ้าหน้าที่',
  chief:          'หัวหน้าเจ้าหน้าที่',
  agency_head:    'หัวหน้าหน่วยงาน',
  agency_officer: 'เจ้าหน้าที่หน่วยงาน',
  executive:      'ผู้บริหาร',
};

export const DRAWER_WIDTH = 240;

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE = 25;
