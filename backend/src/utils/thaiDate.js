'use strict';

// วันที่แบบไทย (พุทธศักราช, เขตเวลา Asia/Bangkok) สำหรับข้อความที่ส่งถึงประชาชน
const TZ = 'Asia/Bangkok';
const LOCALE = 'th-TH-u-ca-buddhist';

const formatThaiDate = (d) =>
  d ? new Intl.DateTimeFormat(LOCALE, { dateStyle: 'long', timeZone: TZ }).format(new Date(d)) : '';

const formatThaiDateTime = (d) =>
  d ? new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short', timeZone: TZ }).format(new Date(d)) : '';

module.exports = { formatThaiDate, formatThaiDateTime };
