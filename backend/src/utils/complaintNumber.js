'use strict';

// Generates DC-YYYYMM-XXXX using row-level atomic increment on complaint_sequences.
// Must be called inside an open transaction connection.
const generateComplaintNumber = async (conn) => {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

  await conn.query(
    `INSERT INTO complaint_sequences (year_month, last_number, updated_at)
     VALUES (?, 1, NOW())
     ON DUPLICATE KEY UPDATE last_number = last_number + 1, updated_at = NOW()`,
    [yearMonth]
  );

  const [[row]] = await conn.query(
    'SELECT last_number FROM complaint_sequences WHERE year_month = ?',
    [yearMonth]
  );

  return `DC-${yearMonth}-${String(row.last_number).padStart(4, '0')}`;
};

module.exports = { generateComplaintNumber };
