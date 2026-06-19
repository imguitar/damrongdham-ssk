'use strict';

// Calendar-day SLA (SLA-06: weekends included)
const calculateDueDate = (slaDays) => {
  const date = new Date();
  date.setDate(date.getDate() + slaDays);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

module.exports = { calculateDueDate };
