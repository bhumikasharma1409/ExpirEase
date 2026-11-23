import { Bell, Menu, Plus, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { daysUntil, getDaysLabel } from '../utils/expiryUtils';
import { useInventory } from '../context/InventoryContext';
import SearchBar from './SearchBar';

export default function Navbar({ onMenu, onAdd }) {
  const { profile, products, settings } = useInventory();
  const [search, setSearch] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const alerts = (settings.reminders ? products : []).filter((product) => {
    const days = daysUntil(product.expiryDate);
    return days >= 0 && days <= 7;
  }).sort((a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate));

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.querySelector('[aria-label="Search products"]')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submitSearch = (event) => {
    event.preventDefault();
    navigate(`/inventory${search ? `?search=${encodeURIComponent(search)}` : ''}`);
  };

  return (
    <header className="topbar">
      <div className="flex min-w-0 items-center gap-3">
        <button className="icon-button lg:hidden" onClick={onMenu} aria-label="Open navigation"><Menu size={19} /></button>
        <div className="hidden min-w-0 sm:block">
          <p className="eyebrow">{new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</p>
          <p className="mt-1 truncate font-display text-sm font-semibold text-ivory">{location.pathname === '/' ? `Good to see you, ${(profile?.name || 'there').split(' ')[0]}` : 'Your personal inventory'}</p>
        </div>
        <form onSubmit={submitSearch} className="ml-1 hidden min-w-0 md:block"><SearchBar value={search} onChange={setSearch} className="top-search" /></form>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <button className="icon-button md:hidden" onClick={() => navigate('/inventory')} aria-label="Search inventory"><Search size={18} /></button>
        <div className="relative">
          <button className={`icon-button relative ${notificationsOpen ? 'icon-button-active' : ''}`} onClick={() => setNotificationsOpen(!notificationsOpen)} aria-label="Notifications">
            <Bell size={18} />
            {alerts.length > 0 && <span className="notification-dot">{alerts.length}</span>}
          </button>
          {notificationsOpen && <div className="notification-popover">
            <div className="flex items-center justify-between border-b border-white/[.08] px-4 py-3"><div><p className="text-sm font-semibold">A little heads-up</p><p className="mt-0.5 text-[11px] text-muted">{alerts.length} items need your attention</p></div><button onClick={() => setNotificationsOpen(false)} aria-label="Close notifications"><X size={15} /></button></div>
            <div className="max-h-64 overflow-y-auto">
              {alerts.length ? alerts.slice(0, 5).map((product) => <button key={product.id} className="notification-item" onClick={() => { navigate('/expiring-soon'); setNotificationsOpen(false); }}><span className="notification-bullet" /><span className="min-w-0 flex-1 text-left"><span className="block truncate text-xs font-medium">{product.name}</span><span className="mt-1 block text-[10px] text-muted">Expires {getDaysLabel(daysUntil(product.expiryDate)).toLowerCase()}</span></span></button>) : <p className="px-4 py-6 text-center text-xs text-muted">All clear. Nothing expiring this week.</p>}
            </div>
            <button className="w-full border-t border-white/[.08] py-3 text-xs font-medium text-lime hover:bg-white/[.03]" onClick={() => { navigate('/expiring-soon'); setNotificationsOpen(false); }}>View all reminders</button>
          </div>}
        </div>
        <div className="hidden h-8 w-px bg-white/[.1] sm:block" />
        <button onClick={() => navigate('/settings')} className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-1.5 hover:bg-white/[.04]">
          <span className="avatar avatar-small">{(profile?.name || 'Y').slice(0, 1).toUpperCase()}</span>
          <span className="hidden max-w-24 truncate text-xs font-medium text-ivory/90 sm:block">{profile?.name || 'Your profile'}</span>
        </button>
        <button onClick={onAdd} className="button-primary !hidden !px-3 !py-2 sm:!flex"><Plus size={15} />Add item</button>
      </div>
    </header>
  );
}
