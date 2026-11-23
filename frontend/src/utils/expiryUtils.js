export const CATEGORY_OPTIONS = [
  'Food & Groceries',
  'Medicines',
  'Personal Care',
  'Household',
  'Others',
];

export function toDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateOnly(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 12);
}

export function daysUntil(expiryDate, today = new Date()) {
  if (!expiryDate) return null;
  const expiry = parseDateOnly(expiryDate);
  const current = parseDateOnly(toDateKey(today));
  if (!expiry || !current) return null;
  return Math.round((Date.UTC(expiry.getFullYear(), expiry.getMonth(), expiry.getDate()) -
    Date.UTC(current.getFullYear(), current.getMonth(), current.getDate())) / 86400000);
}

export function getExpiryStatus(expiryDate, today = new Date()) {
  const days = daysUntil(expiryDate, today);
  if (days === null) return 'safe';
  if (days < 0) return 'expired';
  if (days === 0) return 'today';
  if (days <= 7) return 'soon';
  return 'safe';
}

export function formatDate(dateString, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  const date = parseDateOnly(dateString);
  if (!date) return '—';
  return new Intl.DateTimeFormat(undefined, options).format(date);
}

export function getDaysLabel(days) {
  if (days < 0) return `${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} ago`;
  if (days === 0) return 'Today';
  return `${days} ${days === 1 ? 'day' : 'days'}`;
}
