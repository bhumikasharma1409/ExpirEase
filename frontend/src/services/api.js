const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');
const TOKEN_KEY = 'expiriease.token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Unable to reach the ExpirEase backend. Check that it is running and try again.');
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error('The backend returned an unreadable response.');
  }

  if (!response.ok || result.success === false) {
    if (response.status === 401 && auth && token) {
      clearToken();
      window.dispatchEvent(new Event('expiriease:unauthorized'));
    }
    const details = Array.isArray(result.errors) ? ` ${result.errors.join(' ')}` : '';
    throw new Error(`${result.message || 'The request could not be completed.'}${details}`);
  }

  return result;
}

export function normalizeProduct(product) {
  const dateOnly = (value) => typeof value === 'string' ? value.slice(0, 10) : '';
  return {
    ...product,
    id: product._id || product.id,
    name: product.name || product.productName,
    purchaseDate: dateOnly(product.purchaseDate),
    expiryDate: dateOnly(product.expiryDate),
    discarded: Boolean(product.isDiscarded),
    consumed: Boolean(product.isConsumed),
  };
}

export function normalizeSettings(user) {
  return {
    reminders: user?.notificationPreferences?.inApp ?? true,
    emailReminders: user?.notificationPreferences?.email ?? true,
    reminderDays: user?.reminderPreferences?.daysBeforeExpiry ?? [7, 3, 1],
  };
}
