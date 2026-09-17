'use strict';

// ตัดทุกอักขระที่ไม่ใช่ตัวเลข (รองรับการกรอกแบบมีขีด/เว้นวรรค)
const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '');

// เลขบัตรประชาชนไทย 13 หลัก + ตรวจ check digit (หลักที่ 13)
const isValidThaiIdCard = (value) => {
  const id = digitsOnly(value);
  if (!/^\d{13}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i += 1) sum += Number(id[i]) * (13 - i);
  return (11 - (sum % 11)) % 10 === Number(id[12]);
};

// เบอร์โทรไทย ขึ้นต้น 0 ยาว 9–10 หลัก (เดียวกับ LINE flow)
const isValidThaiPhone = (value) => /^0\d{8,9}$/.test(digitsOnly(value));

module.exports = { digitsOnly, isValidThaiIdCard, isValidThaiPhone };
