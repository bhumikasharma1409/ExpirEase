import { useEffect, useState } from 'react';
import { BellRing, Check, ChevronRight, LogOut, Save, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useInventory } from '../context/InventoryContext';

const REMINDER_DAYS = [1, 3, 7];

export default function Settings() {
  const { user, settings, saveSettings, updateProfile, emailConfigured, logout } = useInventory();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [preferences, setPreferences] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [preferencesBusy, setPreferencesBusy] = useState(false);

  useEffect(() => setName(user?.name || ''), [user?.name]);
  useEffect(() => setPreferences(settings), [settings]);

  const saveProfile = async (event) => {
    event.preventDefault();
    if (name.trim().length < 2) return toast.error('Please enter a name with at least 2 characters.');
    setProfileBusy(true);
    try {
      await updateProfile(name.trim());
      setSaved(true);
      toast.success('Profile updated');
      window.setTimeout(() => setSaved(false), 1800);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProfileBusy(false);
    }
  };

  const persistPreferences = async (nextPreferences) => {
    setPreferences(nextPreferences);
    setPreferencesBusy(true);
    try {
      await saveSettings(nextPreferences);
      toast.success('Reminder preferences saved');
    } catch (error) {
      setPreferences(settings);
      toast.error(error.message);
    } finally {
      setPreferencesBusy(false);
    }
  };

  const toggleSetting = (key) => {
    persistPreferences({ ...preferences, [key]: !preferences[key] });
  };
  const toggleDay = (day) => {
    const days = preferences.reminderDays.includes(day)
      ? preferences.reminderDays.filter((value) => value !== day)
      : [...preferences.reminderDays, day];
    persistPreferences({ ...preferences, reminderDays: days.sort((a, b) => b - a) });
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
          <label><span className="field-label">Email address</span><input value={user?.email || ''} readOnly /><span className="mt-1.5 block text-[10px] text-muted">Email changes aren’t available.</span></label>
          <div className="sm:col-span-2"><button disabled={profileBusy} className="button-primary !py-2.5">{saved ? <Check size={15} /> : <Save size={15} />}{profileBusy ? 'Saving…' : saved ? 'Saved' : 'Save changes'}</button></div>
        </form>
      </section>
      <section className="settings-card">
        <div className="settings-card-heading"><span className="settings-icon settings-icon-amber"><BellRing size={18} /></span><div><h2 className="font-display text-sm font-semibold">Reminders</h2><p className="mt-1 text-xs text-muted">Choose when ExpirEase keeps you in the loop.</p></div></div>
        <div className="mt-4 divide-y divide-white/[.07]">
          <Preference label="In-app reminders" description="Show expiry reminders in your notification list." value={preferences.reminders} disabled={preferencesBusy} onChange={() => toggleSetting('reminders')} />
          <Preference label="Email reminders" description={emailConfigured ? 'Email delivery is configured on the backend.' : 'Email reminders need SMTP settings in backend/.env before they can be delivered.'} value={preferences.emailReminders} disabled={preferencesBusy} onChange={() => toggleSetting('emailReminders')} />
        </div>
        <div className="mt-3 border-t border-white/[.07] pt-4">
          <p className="text-xs font-medium text-ivory">Remind me before expiry</p>
          <p className="mt-1 text-[11px] text-muted">In-app reminders follow these intervals. Email reminders use 7, 3, 1, and 0 days before expiry and are checked daily at 09:00 Asia/Kolkata.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {REMINDER_DAYS.map((day) => {
              const active = preferences.reminderDays.includes(day);
              return <button key={day} type="button" disabled={preferencesBusy} onClick={() => toggleDay(day)} className={`rounded-full border px-3 py-1.5 text-xs transition ${active ? 'border-lime/40 bg-lime/10 text-lime' : 'border-white/10 text-muted hover:text-ivory'}`}>{day} {day === 1 ? 'day' : 'days'} before</button>;
            })}
          </div>
        </div>
      </section>
      <section className="settings-card">
        <div className="settings-card-heading"><span className="settings-icon settings-icon-coral"><LogOut size={18} /></span><div><h2 className="font-display text-sm font-semibold">Session</h2><p className="mt-1 text-xs text-muted">Your inventory is associated with your account.</p></div></div>
        <button onClick={handleLogout} className="mt-5 flex w-full items-center justify-between rounded-xl border border-white/[.08] px-4 py-3 text-left transition hover:border-coral/30 hover:bg-coral/[.04]"><span><span className="block text-xs font-medium text-ivory">Sign out</span><span className="mt-1 block text-[10px] text-muted">Return to the sign-in screen</span></span><ChevronRight size={16} className="text-muted" /></button>
      </section>
      <p className="page-footnote">Your space, your pace. <span>— ExpirEase</span></p>
    </div>
  );
}

function Preference({ label, description, value, disabled, onChange }) {
  return <div className="flex items-center justify-between gap-4 py-4"><div><p className="text-xs font-medium text-ivory">{label}</p><p className="mt-1 max-w-md text-[11px] leading-relaxed text-muted">{description}</p></div><button type="button" role="switch" aria-checked={value} disabled={disabled} onClick={onChange} className={`toggle-switch ${value ? 'toggle-on' : ''}`}><span /></button></div>;
}
