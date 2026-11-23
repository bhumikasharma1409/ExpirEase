const DAY_MS = 24 * 60 * 60 * 1000;

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateKeyFromValue(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export function parseDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

export function getDateBounds(today = new Date()) {
  const todayKey = localDateKey(today);
  const start = parseDateOnly(todayKey);
  const tomorrow = new Date(start.getTime() + DAY_MS);
  const eighthDay = new Date(start.getTime() + DAY_MS * 8);
  return {
    today: start,
    tomorrow,
    eighthDay,
    todayKey,
  };
}

export function getDaysUntil(expiryDate, today = new Date()) {
  const expiryKey = dateKeyFromValue(expiryDate);
  if (!expiryKey) return null;
  const expiry = parseDateOnly(expiryKey);
  const current = parseDateOnly(localDateKey(today));
  return Math.round((expiry.getTime() - current.getTime()) / DAY_MS);
}

export function getExpiryStatus(expiryDate, today = new Date()) {
  const days = getDaysUntil(expiryDate, today);
  if (days === null) return null;
  if (days < 0) return 'expired';
  if (days === 0) return 'today';
  if (days <= 7) return 'soon';
  return 'safe';
}

export function getStatusDateFilter(status, today = new Date()) {
  const { today: startToday, tomorrow, eighthDay } = getDateBounds(today);
  switch (status) {
    case 'expired':
      return { expiryDate: { $lt: startToday } };
    case 'today':
      return { expiryDate: { $gte: startToday, $lt: tomorrow } };
    case 'soon':
      return { expiryDate: { $gte: tomorrow, $lt: eighthDay } };
    case 'safe':
      return { expiryDate: { $gte: eighthDay } };
    default:
      return null;
  }
}
