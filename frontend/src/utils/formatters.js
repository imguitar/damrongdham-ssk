import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(buddhistEra);
dayjs.extend(relativeTime);
dayjs.locale('th');

export const formatDate = (value) => {
  if (!value) return '-';
  return dayjs(value).format('D MMM BBBB');
};

export const formatDateTime = (value) => {
  if (!value) return '-';
  return dayjs(value).format('D MMM BBBB HH:mm');
};

export const formatDateShort = (value) => {
  if (!value) return '-';
  return dayjs(value).format('DD/MM/BBBB');
};

export const formatRelative = (value) => {
  if (!value) return '-';
  return dayjs(value).fromNow();
};

export const formatNumber = (value) => {
  if (value === null || value === undefined) return '-';
  return Number(value).toLocaleString('th-TH');
};

export const formatCurrency = (value) => {
  if (value === null || value === undefined) return '-';
  return Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 });
};

export const truncate = (str, maxLen = 60) => {
  if (!str) return '-';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
};
