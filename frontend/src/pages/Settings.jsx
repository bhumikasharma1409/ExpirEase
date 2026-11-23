import { useState } from 'react';
import { BellRing, Check, ChevronRight, LogOut, Save, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useInventory } from '../context/InventoryContext';

export default function Settings() {
  const { profile, setProfile, user, settings, setSettings, logout } = useInventory();
  const navigate = useNavigate();
  const [name, setName] = useState(profile?.name || '');
  const [saved, setSaved] = useState(false);
  const saveProfile = (event) => {
    event.preventDefault();
    if (name.trim().length < 2) return toast.error('Please enter a name with at least 2 characters.');
    setProfile({ ...profile, name: name.trim() });
    setSaved(true);
    toast.success('Profile updated');
    window.setTimeout(() => setSaved(false), 1800);
  };
  const toggleSetting = (key) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
    toast.success('Preference updated');
  };
  const handleLogout = () => {
    logout();
    toast.success('You’ve been signed out');
    navigate('/login');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><p className="eyebrow">MAKE YOURSELF AT HOME</p><h1 className="page-title">Settings</h1><p className="mt-2 text-sm text-muted">A few details to make this space feel like yours.</p></div>
      <section className="settings-card">
        <div className="settings-card-heading"><span className="settings-icon"><UserRound size={18} /></span><div><h2 className="font-display text-sm font-semibold">Your profile</h2><p className="mt-1 text-xs text-muted">The name we use to say hello.</p></div></div>
        <form onSubmit={saveProfile} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label><span className="field-label">Full name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></label>
          <label><span className="field-label">Email address</span><input value={user?.email || ''} readOnly /><span className="mt-1.5 block text-[10px] text-muted">Email changes aren’t available in this demo.</span></label>
          <div className="sm:col-span-2"><button className="button-primary !py-2.5">{saved ? <Check size={15} /> : <Save size={15} />}{saved ? 'Saved' : 'Save changes'}</button></div>
        </form>
      </section>
      <section className="settings-card">
        <div className="settings-card-heading"><span className="settings-icon settings-icon-amber"><BellRing size={18} /></span><div><h2 className="font-display text-sm font-semibold">Reminders</h2><p className="mt-1 text-xs text-muted">Choose how ExpirEase keeps you in the loop.</p></div></div>
        <div className="mt-4 divide-y divide-white/[.07]">
          <Preference label="In-app reminders" description="See a heads-up for items expiring in the next 7 days." value={settings.reminders} onChange={() => toggleSetting('reminders')} />
          <Preference label="Email reminders" description="Email delivery is a visual preference only in this frontend demo." value={settings.emailReminders} onChange={() => toggleSetting('emailReminders')} />
        </div>
      </section>
      <section className="settings-card">
        <div className="settings-card-heading"><span className="settings-icon settings-icon-coral"><LogOut size={18} /></span><div><h2 className="font-display text-sm font-semibold">Session</h2><p className="mt-1 text-xs text-muted">Your inventory stays on this device.</p></div></div>
        <button onClick={handleLogout} className="mt-5 flex w-full items-center justify-between rounded-xl border border-white/[.08] px-4 py-3 text-left transition hover:border-coral/30 hover:bg-coral/[.04]"><span><span className="block text-xs font-medium text-ivory">Sign out</span><span className="mt-1 block text-[10px] text-muted">Return to the sign-in screen</span></span><ChevronRight size={16} className="text-muted" /></button>
      </section>
      <p className="page-footnote">Your space, your pace. <span>— ExpirEase</span></p>
    </div>
  );
}

function Preference({ label, description, value, onChange }) {
  return <div className="flex items-center justify-between gap-4 py-4"><div><p className="text-xs font-medium text-ivory">{label}</p><p className="mt-1 max-w-md text-[11px] leading-relaxed text-muted">{description}</p></div><button role="switch" aria-checked={value} onClick={onChange} className={`toggle-switch ${value ? 'toggle-on' : ''}`}><span /></button></div>;
}
