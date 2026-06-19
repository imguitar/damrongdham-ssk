'use strict';

const ExcelJS = require('exceljs');

const MONTHS_TH = [
  '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const STATUS_TH = {
  NEW: 'ใหม่', SCREENING: 'กำลังคัดกรอง', ASSIGNED: 'ส่งต่อแล้ว',
  ACCEPTED: 'รับเรื่องแล้ว', IN_PROGRESS: 'กำลังดำเนินการ',
  RESOLVED: 'ส่งผลแล้ว', REVIEWING: 'กำลังตรวจผล',
  CLOSED: 'ปิดเรื่อง', REJECTED: 'ปฏิเสธ', RETURNED: 'ส่งคืน',
};

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };
const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };

const styleHeader = (sheet) => {
  const row = sheet.getRow(1);
  row.font = HEADER_FONT;
  row.fill = HEADER_FILL;
  row.alignment = { horizontal: 'center', vertical: 'middle' };
  row.height = 22;
};

// Build Excel workbook for the given report type
const createExcelReport = async (type, data, meta = {}) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'DCMS';
  workbook.created = new Date();

  if (type === 'monthly') {
    const sheet = workbook.addWorksheet('รายงานรายเดือน');
    sheet.columns = [
      { header: 'ปี (พ.ศ.)',         key: 'year_be',   width: 12 },
      { header: 'เดือน',              key: 'month_name', width: 16 },
      { header: 'รับเรื่องทั้งหมด',   key: 'total',      width: 18 },
      { header: 'ปิดเรื่องแล้ว',      key: 'closed',     width: 16 },
      { header: 'กำลังดำเนินการ',     key: 'active',     width: 18 },
      { header: 'เกินกำหนด',          key: 'overdue',    width: 14 },
      { header: 'ลำดับความสำคัญสูง',  key: 'high',       width: 18 },
    ];
    styleHeader(sheet);
    data.forEach(r => sheet.addRow({
      year_be: r.year + 543,
      month_name: MONTHS_TH[r.month] || r.month,
      total: r.total, closed: r.closed, active: r.active,
      overdue: r.overdue, high: r.high_priority,
    }));

  } else if (type === 'by-category') {
    const sheet = workbook.addWorksheet('รายงานตามประเภทเรื่อง');
    sheet.columns = [
      { header: 'ประเภทเรื่อง',         key: 'name',     width: 28 },
      { header: 'SLA (วัน)',             key: 'sla_days', width: 12 },
      { header: 'รับเรื่องทั้งหมด',     key: 'total',    width: 18 },
      { header: 'ปิดเรื่องแล้ว',        key: 'closed',   width: 16 },
      { header: 'กำลังดำเนินการ',       key: 'active',   width: 18 },
      { header: 'เกินกำหนด',            key: 'overdue',  width: 14 },
    ];
    styleHeader(sheet);
    data.forEach(r => sheet.addRow(r));

  } else if (type === 'by-agency') {
    const sheet = workbook.addWorksheet('รายงานตามหน่วยงาน');
    sheet.columns = [
      { header: 'หน่วยงาน',           key: 'name',     width: 32 },
      { header: 'ชื่อย่อ',            key: 'short_name', width: 16 },
      { header: 'รับเรื่องทั้งหมด',   key: 'total',    width: 18 },
      { header: 'ปิดเรื่องแล้ว',      key: 'closed',   width: 16 },
      { header: 'กำลังดำเนินการ',     key: 'active',   width: 18 },
      { header: 'เกินกำหนด',          key: 'overdue',  width: 14 },
    ];
    styleHeader(sheet);
    data.forEach(r => sheet.addRow(r));

  } else if (type === 'overdue') {
    const sheet = workbook.addWorksheet('รายงานเรื่องเกินกำหนด');
    sheet.columns = [
      { header: 'เลขที่เรื่อง',         key: 'complaint_number', width: 22 },
      { header: 'หัวเรื่อง',            key: 'title',            width: 44 },
      { header: 'สถานะ',               key: 'status_th',        width: 20 },
      { header: 'ประเภท',              key: 'category_name',    width: 24 },
      { header: 'หน่วยงาน',            key: 'agency_name',      width: 28 },
      { header: 'วันครบกำหนด',         key: 'due_date',         width: 16 },
      { header: 'เกินกำหนด (วัน)',     key: 'days_overdue',     width: 18 },
      { header: 'ความสำคัญ',           key: 'priority',         width: 14 },
    ];
    styleHeader(sheet);
    data.forEach(r => sheet.addRow({
      ...r,
      status_th: STATUS_TH[r.status] || r.status,
      category_name: r.category_name || '-',
      agency_name: r.agency_name || '-',
    }));
  }

  // Auto-fit: apply basic border and alternate row color
  const sheet = workbook.worksheets[0];
  if (sheet) {
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      if (rowNumber % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
      }
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        };
      });
    });
  }

  return workbook;
};

module.exports = { createExcelReport };
