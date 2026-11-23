import { NavLink, useNavigate } from 'react-router-dom';
import { Archive, BellRing, CircleHelp, LayoutDashboard, LogOut, Plus, Settings, ShieldCheck, X } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { daysUntil } from '../utils/expiryUtils';

const mainLinks = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/inventory', label: 'My inventory', icon: Archive },
];
const watchLinks = [
  { to: '/expiring-soon', label: 'Expiring soon', icon: BellRing, status: 'soon' },
  { to: '/expired', label: 'Expired items', icon: ShieldCheck, status: 'expired' },
];

export default function Sidebar({ open, onClose, onAdd }) {
  const { products, logout, profile, settings } = useInventory();
  const navigate = useNavigate();
  const urgent = (settings.reminders ? products : []).filter((item) => {
    const days = daysUntil(item.expiryDate);
    return days >= 0 && days <= 7;
  }).length;

  return (
    <>
      {open && <button className="drawer-scrim lg:hidden" onClick={onClose} aria-label="Close navigation" />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="flex h-[76px] items-center justify-between px-6">
          <button className="flex items-center gap-3 text-left" onClick={() => navigate('/')}>
            <span className="brand-mark"><span /></span>
            <span><span className="block font-display text-[16px] font-bold tracking-tight">ExpirEase</span><span className="block text-[9px] uppercase tracking-[.2em] text-muted">MAKE IT COUNT</span></span>
          </button>
          <button className="icon-button !h-8 !w-8 lg:hidden" onClick={onClose} aria-label="Close menu"><X size={17} /></button>
        </div>
        <div className="px-4 pt-5">
          <button className="sidebar-add" onClick={() => { onAdd(); onClose(); }}><Plus size={17} strokeWidth={2.2} /><span>Add a product</span><span className="ml-auto text-[9px] uppercase tracking-wider opacity-60">NEW</span></button>
        </div>
        <nav className="sidebar-nav">
          <p className="nav-section-label">WORKSPACE</p>
          {mainLinks.map(({ to, label, icon: Icon, end }) => <NavItem key={to} to={to} label={label} icon={Icon} end={end} onClick={onClose} />)}
          <p className="nav-section-label mt-8">KEEP AN EYE ON</p>
          {watchLinks.map(({ to, label, icon: Icon, status }) => <NavItem key={to} to={to} label={label} icon={Icon} onClick={onClose} count={status === 'soon' ? urgent : undefined} />)}
          <p className="nav-section-label mt-8">PREFERENCES</p>
          <NavItem to="/settings" label="Settings" icon={Settings} onClick={onClose} />
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="flex items-center gap-2 text-lime"><CircleHelp size={15} /><span className="text-[11px] font-semibold">A small reminder</span></div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">A little attention today can save a good thing tomorrow.</p>
          </div>
          <div className="sidebar-profile">
            <button className="flex min-w-0 flex-1 items-center gap-2.5 text-left" onClick={() => navigate('/settings')}>
              <span className="avatar">{(profile?.name || 'Y').slice(0, 1).toUpperCase()}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-ivory">{profile?.name || 'Your account'}</span><span className="text-[10px] text-muted">Personal space</span></span>
            </button>
            <button className="icon-button !h-8 !w-8" onClick={() => { logout(); navigate('/login'); }} aria-label="Log out"><LogOut size={15} /></button>
          </div>
        </div>
      </aside>
    </>
  );
}

function NavItem({ to, label, icon: Icon, end, onClick, count }) {
  return (
    <NavLink end={end} to={to} onClick={onClick} className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
      <Icon size={17} strokeWidth={1.8} /><span>{label}</span>{count > 0 && <span className="nav-count">{count}</span>}
    </NavLink>
  );
}
