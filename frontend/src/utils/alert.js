import Swal from 'sweetalert2';

// ─────────────────────────────────────────────────────────────────────────────
// ศูนย์กลางการแจ้งเตือน (SweetAlert2) — ให้ทุกข้อความสื่อความหมายชัดเจน
//
// หลักการ:
//  1. backend ส่งข้อความภาษาไทยที่ชัดเจนมาอยู่แล้ว (error.message) → ใช้ค่านั้นก่อน
//  2. ถ้าไม่มีข้อความ แต่มี error code ที่รู้จัก → แปลงเป็นคำอธิบายที่เป็นมิตร
//  3. ถ้าเชื่อมต่อ server ไม่ได้ (ไม่มี response) → บอกให้ชัดว่าเป็นปัญหาเครือข่าย
//  4. สุดท้ายจริง ๆ จึงค่อยใช้ fallback ทั่วไป
// ─────────────────────────────────────────────────────────────────────────────

// error code → ข้อความที่เป็นมิตร (ใช้เมื่อ backend ไม่ได้ส่ง message มา)
const CODE_MESSAGES = {
  INVALID_CREDENTIALS: 'ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง',
  INVALID_PASSWORD: 'รหัสผ่านปัจจุบันไม่ถูกต้อง',
  EMAIL_EXISTS: 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น หรือเข้าสู่ระบบด้วยอีเมลนี้',
  PASSWORD_ALREADY_SET: 'บัญชีนี้มีรหัสผ่านอยู่แล้ว กรุณาใช้เมนู "เปลี่ยนรหัสผ่าน"',
  VALIDATION_ERROR: 'ข้อมูลที่กรอกไม่ถูกต้องหรือไม่ครบถ้วน กรุณาตรวจสอบอีกครั้ง',
  UNAUTHORIZED: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ',
  TOKEN_EXPIRED: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
  INVALID_TOKEN: 'เซสชันไม่ถูกต้อง กรุณาเข้าสู่ระบบอีกครั้ง',
  FORBIDDEN: 'คุณไม่มีสิทธิ์ดำเนินการนี้',
  NOT_FOUND: 'ไม่พบข้อมูลที่ต้องการ',
  INVALID_TRANSITION: 'ไม่สามารถเปลี่ยนสถานะเรื่องในขั้นตอนนี้ได้',
  RATE_LIMITED: 'คุณดำเนินการบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่',
  FILE_TOO_LARGE: 'ไฟล์มีขนาดเกินกำหนด (สูงสุด 10 MB)',
  FILE_TYPE_ERROR: 'ประเภทไฟล์ไม่รองรับ (อนุญาต jpg, jpeg, png, pdf, doc, docx)',
  LINE_NOT_LINKED: 'ผู้ร้องยังไม่ได้ผูกบัญชี LINE จึงส่งข้อความไม่ได้',
  LINE_NOT_CONFIGURED: 'ระบบยังไม่ได้ตั้งค่าการเชื่อมต่อ LINE',
  ATTACHMENT_WINDOW_CLOSED: 'ไม่สามารถแนบไฟล์กับเรื่องนี้ได้ (เกินช่วงเวลาที่กำหนด)',
  NETWORK: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง',
};

const DEFAULT_FALLBACK = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';

// HTTP status → ข้อความที่เป็นมิตร (ใช้เมื่อ backend ไม่ได้ส่ง error envelope ที่มี message)
// กันไม่ให้ผู้ใช้เห็นข้อความดิบแบบ "Request failed with status code 500"
const STATUS_MESSAGES = {
  400: 'ข้อมูลที่ส่งไปไม่ถูกต้อง กรุณาตรวจสอบแล้วลองใหม่',
  401: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ',
  403: 'คุณไม่มีสิทธิ์ดำเนินการนี้',
  404: 'ไม่พบข้อมูลที่ต้องการ',
  409: 'ข้อมูลนี้มีอยู่แล้วหรือขัดแย้งกับข้อมูลเดิม',
  413: 'ไฟล์หรือข้อมูลมีขนาดใหญ่เกินกำหนด',
  429: 'คุณดำเนินการบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่',
  500: 'ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งภายหลัง',
  502: 'ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งภายหลัง',
  503: 'ระบบไม่พร้อมให้บริการชั่วคราว กรุณาลองใหม่อีกครั้งภายหลัง',
  504: 'ระบบตอบสนองช้ากว่าปกติ กรุณาลองใหม่อีกครั้ง',
};

// ข้อความดิบจาก axios ที่ไม่ควรแสดงให้ผู้ใช้เห็นตรง ๆ
const isRawAxiosMessage = (m) =>
  !m || /^request failed with status code/i.test(m) || /^network error$/i.test(m) || /^timeout of /i.test(m);

// ดึงข้อความ error ที่สื่อความหมายที่สุดจาก error object/axios error/string
export const extractError = (err, fallback) => {
  if (!err) return fallback || DEFAULT_FALLBACK;
  if (typeof err === 'string') return err;

  // axios: มี request แต่ไม่มี response = เครือข่าย/timeout/CORS
  if (err.isAxiosError && !err.response) {
    if (err.code === 'ECONNABORTED') return 'การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง';
    return CODE_MESSAGES.NETWORK;
  }

  const apiErr = err.response?.data?.error;
  if (apiErr?.message) return apiErr.message;                 // ข้อความจาก backend (ชัดเจนอยู่แล้ว)
  if (apiErr?.code && CODE_MESSAGES[apiErr.code]) return CODE_MESSAGES[apiErr.code];

  // มี response แต่ไม่มี error envelope → แปลตาม HTTP status (กันข้อความดิบ)
  const status = err.response?.status;
  if (status && STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];
  if (status >= 500) return STATUS_MESSAGES[500];

  // อย่าแสดงข้อความดิบของ axios ให้ผู้ใช้
  if (err.message && !isRawAxiosMessage(err.message)) return err.message;
  return fallback || DEFAULT_FALLBACK;
};

// ธีมปุ่มให้เข้ากับ MUI theme ของระบบ
const THEME = {
  confirmButtonColor: '#1565C0',
  cancelButtonColor: '#9e9e9e',
  denyButtonColor: '#C62828',
};

// ── Modal (บล็อกจนกว่าจะกดปิด) — ใช้กับ error/ผลลัพธ์สำคัญ ──────────────────────
export const alertError = (err, { title = 'ดำเนินการไม่สำเร็จ', fallback } = {}) =>
  Swal.fire({
    icon: 'error',
    title,
    text: extractError(err, fallback),
    confirmButtonText: 'ตกลง',
    ...THEME,
  });

export const alertSuccess = (text, { title = 'สำเร็จ', ...rest } = {}) =>
  Swal.fire({ icon: 'success', title, text, confirmButtonText: 'ตกลง', ...THEME, ...rest });

export const alertWarning = (text, { title = 'แจ้งเตือน' } = {}) =>
  Swal.fire({ icon: 'warning', title, text, confirmButtonText: 'ตกลง', ...THEME });

export const alertInfo = (text, { title = 'ข้อมูล' } = {}) =>
  Swal.fire({ icon: 'info', title, text, confirmButtonText: 'ตกลง', ...THEME });

// ── Confirm — คืน Promise<boolean> (true = ผู้ใช้กดยืนยัน) ────────────────────
export const confirmAction = async ({
  title = 'ยืนยันการดำเนินการ',
  text = '',
  html,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  icon = 'question',
  danger = false,
} = {}) => {
  const res = await Swal.fire({
    icon,
    title,
    text: html ? undefined : text,
    html,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    focusCancel: danger,
    ...THEME,
    confirmButtonColor: danger ? THEME.denyButtonColor : THEME.confirmButtonColor,
  });
  return res.isConfirmed;
};

// ── Toast — ไม่บล็อก มุมขวาบน หายเอง ใช้กับผลลัพธ์ทั่วไป (บันทึก/อัปเดตสำเร็จ) ──
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2600,
  timerProgressBar: true,
  didOpen: (el) => {
    el.addEventListener('mouseenter', Swal.stopTimer);
    el.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

export const toastSuccess = (title) => Toast.fire({ icon: 'success', title });
export const toastError = (err, fallback) => Toast.fire({ icon: 'error', title: extractError(err, fallback), timer: 3500 });
export const toastInfo = (title) => Toast.fire({ icon: 'info', title });

export default {
  extractError, alertError, alertSuccess, alertWarning, alertInfo,
  confirmAction, toastSuccess, toastError, toastInfo,
};
