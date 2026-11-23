import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { apiRequest, clearToken, getToken, normalizeProduct, normalizeSettings, setToken } from '../services/api';

const LEGACY_KEYS = ['expiriease.inventory', 'expiriease.user', 'expiriease.profile', 'expiriease.settings'];
const InventoryContext = createContext(null);

function getUser(result) {
  return result?.data?.user || null;
}

function productRequest(product) {
  return {
    name: product.name,
    category: product.category,
    quantity: product.quantity,
    unit: product.unit,
    purchaseDate: product.purchaseDate,
    expiryDate: product.expiryDate,
    notes: product.notes || '',
    image: product.image || '',
  };
}

export function InventoryProvider({ children }) {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({ reminders: true, emailReminders: true, reminderDays: [7, 3, 1] });
  const [products, setProducts] = useState([]);
  const [productsMeta, setProductsMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [dashboard, setDashboard] = useState(null);
  const [priorityProducts, setPriorityProducts] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const previousList = useRef({ query: {}, endpoint: '/api/products' });

  const applyUser = useCallback((nextUser) => {
    setUser(nextUser);
    setSettings(normalizeSettings(nextUser));
  }, []);

  const clearSession = useCallback(() => {
    clearToken();
    previousList.current = { query: {}, endpoint: '/api/products' };
    setUser(null);
    setProducts([]);
    setProductsMeta({ page: 1, limit: 20, total: 0, totalPages: 0 });
    setDashboard(null);
    setPriorityProducts([]);
    setRecentProducts([]);
    setNotifications([]);
    setEmailConfigured(false);
  }, []);

  useEffect(() => {
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
    const onUnauthorized = () => {
      clearSession();
      toast.error('Your session expired. Please sign in again.');
    };
    window.addEventListener('expiriease:unauthorized', onUnauthorized);

    const restore = async () => {
      const token = getToken();
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        const result = await apiRequest('/api/auth/me');
        applyUser(getUser(result));
      } catch (error) {
        clearSession();
        if (error.message.startsWith('Unable to reach') || error.message.startsWith('The backend returned')) {
          toast.error(error.message);
        }
      } finally {
        setAuthLoading(false);
      }
    };
    restore();
    return () => window.removeEventListener('expiriease:unauthorized', onUnauthorized);
  }, [applyUser, clearSession]);

  const loadProducts = useCallback(async (query = {}, endpoint = '/api/products') => {
    previousList.current = { query, endpoint };
    const search = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
    });
    const suffix = search.size ? `?${search}` : '';
    const endpoints = Array.isArray(endpoint) ? endpoint : [endpoint];
    setDataLoading(true);
    try {
      const results = await Promise.all(endpoints.map((path) => apiRequest(`${path}${suffix}`)));
      const data = results[0]?.data || {};
      const list = results.flatMap((result) => result.data?.products || []).map(normalizeProduct);
      setProducts(list);
      if (data.pagination) setProductsMeta(data.pagination);
      else setProductsMeta({ page: 1, limit: list.length, total: data.count ?? list.length, totalPages: 1 });
      return list;
    } catch (error) {
      setProducts([]);
      setProductsMeta({ page: 1, limit: 20, total: 0, totalPages: 0 });
      throw error;
    } finally {
      setDataLoading(false);
    }
  }, []);

  const refreshDashboard = useCallback(async () => {
    const [statsResult, priorityResult, recentResult] = await Promise.all([
      apiRequest('/api/dashboard'),
      apiRequest('/api/products/priority?limit=4'),
      apiRequest('/api/products?sort=recent&limit=5'),
    ]);
    setDashboard(statsResult.data);
    setPriorityProducts((priorityResult.data?.products || []).map(normalizeProduct));
    setRecentProducts((recentResult.data?.products || []).map(normalizeProduct));
  }, []);

  const refreshNotifications = useCallback(async () => {
    const result = await apiRequest('/api/notifications');
    setNotifications(result.data?.notifications || []);
    setEmailConfigured(Boolean(result.data?.emailConfigured));
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    setDataLoading(true);
    setDataError('');
    Promise.all([refreshDashboard(), refreshNotifications()])
      .catch((error) => setDataError(error.message))
      .finally(() => setDataLoading(false));
  }, [user?.id, loadProducts, refreshDashboard, refreshNotifications]);

  const register = useCallback(async (credentials) => {
    const result = await apiRequest('/api/auth/register', { method: 'POST', auth: false, body: credentials });
    setToken(result.data.token);
    applyUser(getUser(result));
    return result.data.user;
  }, [applyUser]);

  const login = useCallback(async (credentials) => {
    const result = await apiRequest('/api/auth/login', { method: 'POST', auth: false, body: credentials });
    setToken(result.data.token);
    applyUser(getUser(result));
    return result.data.user;
  }, [applyUser]);

  const logout = useCallback(() => clearSession(), [clearSession]);

  const refreshCurrentList = useCallback(() => {
    const { query, endpoint } = previousList.current;
    return loadProducts(query, endpoint);
  }, [loadProducts]);

  const addProduct = useCallback(async (product) => {
    await apiRequest('/api/products', { method: 'POST', body: productRequest(product) });
    await Promise.all([refreshCurrentList(), refreshDashboard()]);
  }, [refreshCurrentList, refreshDashboard]);

  const updateProduct = useCallback(async (product) => {
    await apiRequest(`/api/products/${encodeURIComponent(product.id)}`, { method: 'PUT', body: productRequest(product) });
    await Promise.all([refreshCurrentList(), refreshDashboard()]);
  }, [refreshCurrentList, refreshDashboard]);

  const deleteProduct = useCallback(async (id) => {
    await apiRequest(`/api/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await Promise.all([refreshCurrentList(), refreshDashboard()]);
  }, [refreshCurrentList, refreshDashboard]);

  const updateProductStatus = useCallback(async (id, status) => {
    await apiRequest(`/api/products/${encodeURIComponent(id)}/${status}`, { method: 'PATCH' });
    await Promise.all([refreshCurrentList(), refreshDashboard()]);
  }, [refreshCurrentList, refreshDashboard]);

  const discardProduct = useCallback((id) => updateProductStatus(id, 'discarded'), [updateProductStatus]);
  const consumeProduct = useCallback((id) => updateProductStatus(id, 'consumed'), [updateProductStatus]);

  const updateProfile = useCallback(async (name) => {
    const result = await apiRequest('/api/auth/me', { method: 'PATCH', body: { name } });
    applyUser(getUser(result));
  }, [applyUser]);

  const saveSettings = useCallback(async (nextSettings) => {
    const result = await apiRequest('/api/auth/me', {
      method: 'PATCH',
      body: {
        notificationPreferences: {
          inApp: nextSettings.reminders,
          email: nextSettings.emailReminders,
        },
        reminderPreferences: { daysBeforeExpiry: nextSettings.reminderDays },
      },
    });
    applyUser(getUser(result));
  }, [applyUser]);

  const markNotificationRead = useCallback(async (id) => {
    await apiRequest(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
    setNotifications((current) => current.map((item) => item._id === id ? { ...item, readAt: new Date().toISOString() } : item));
  }, []);

  const value = useMemo(() => ({
    user,
    profile: user,
    settings,
    products,
    productsMeta,
    dashboard,
    priorityProducts,
    recentProducts,
    notifications,
    emailConfigured,
    authLoading,
    dataLoading,
    dataError,
    loadProducts,
    refreshDashboard,
    refreshNotifications,
    addProduct,
    updateProduct,
    deleteProduct,
    discardProduct,
    consumeProduct,
    updateProfile,
    saveSettings,
    markNotificationRead,
    login,
    signup: register,
    logout,
  }), [
    user, settings, products, productsMeta, dashboard, priorityProducts, recentProducts, notifications, emailConfigured,
    authLoading, dataLoading, dataError, loadProducts, refreshDashboard, refreshNotifications,
    addProduct, updateProduct, deleteProduct, discardProduct, consumeProduct, updateProfile,
    saveSettings, markNotificationRead, login, register, logout,
  ]);

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
}
