import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const INVENTORY_KEY = 'expiriease.inventory';
const USER_KEY = 'expiriease.user';
const PROFILE_KEY = 'expiriease.profile';
const SETTINGS_KEY = 'expiriease.settings';

const InventoryContext = createContext(null);

function readInventory() {
  const savedProducts = readStorage(INVENTORY_KEY, []);
  if (!Array.isArray(savedProducts)) return [];
  return savedProducts.filter((product) => !/^sample-\d+$/.test(product?.id || ''));
}

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.error(`Unable to read ${key} from localStorage`, error);
    return fallback;
  }
}

export function InventoryProvider({ children }) {
  const [products, setProducts] = useState(readInventory);
  const [user, setUser] = useState(() => readStorage(USER_KEY, null));
  const [profile, setProfile] = useState(() => readStorage(PROFILE_KEY, null));
  const [settings, setSettings] = useState(() => readStorage(SETTINGS_KEY, { reminders: true, emailReminders: true }));

  useEffect(() => localStorage.setItem(INVENTORY_KEY, JSON.stringify(products)), [products]);
  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);
  useEffect(() => {
    if (profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);
  useEffect(() => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)), [settings]);

  const addProduct = (product) => setProducts((current) => [{ ...product, id: crypto.randomUUID(), discarded: false }, ...current]);
  const updateProduct = (product) => setProducts((current) => current.map((item) => item.id === product.id ? product : item));
  const deleteProduct = (id) => setProducts((current) => current.filter((product) => product.id !== id));
  const discardProduct = (id) => setProducts((current) => current.map((product) => product.id === id ? { ...product, discarded: true } : product));
  const login = (account) => {
    setUser({ email: account.email });
    const existing = readStorage(PROFILE_KEY, null);
    setProfile(existing || { name: account.name || account.email.split('@')[0] });
  };
  const signup = (account) => {
    const nextProfile = { name: account.name };
    setProfile(nextProfile);
    setUser({ email: account.email });
  };
  const logout = () => setUser(null);

  const value = useMemo(() => ({
    products: products.filter((product) => !product.discarded),
    allProducts: products,
    addProduct, updateProduct, deleteProduct, discardProduct,
    user, profile, setProfile, settings, setSettings, login, signup, logout,
  }), [products, user, profile, settings]);

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
}
