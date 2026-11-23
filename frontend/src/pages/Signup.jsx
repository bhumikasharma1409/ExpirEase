import { useState } from 'react';
import { Eye, EyeOff, MoveUpRight } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useInventory } from '../context/InventoryContext';
import { AuthFrame } from './Login';

export default function Signup() {
  const { user, signup, authLoading } = useInventory();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2) return setError('Please enter your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Enter a valid email address.');
    if (form.password.length < 8) return setError('Use at least 8 characters for your password.');
    if (form.password !== form.confirm) return setError('Those passwords do not match.');
    setBusy(true);
    setError('');
    try {
      await signup({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      toast.success('Your space is ready');
      navigate('/');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  if (authLoading) return <div className="auth-page items-center justify-center text-sm text-muted">Checking your session…</div>;
  return (
    <AuthFrame eyebrow="A FRESH START, RIGHT ON TIME" title={<>Keep good<br /><em>things close.</em></>} description="A thoughtful little home for the things you’ve brought into your life.">
      <div className="auth-form-wrap">
        <p className="eyebrow">MAKE IT YOURS</p><h2 className="mt-2 font-display text-2xl font-semibold">Create your space</h2><p className="mt-2 text-sm text-muted">It takes a moment. Your inventory is waiting.</p>
        <form className="mt-6 space-y-3.5" onSubmit={submit}>
          <label><span className="field-label">Full name</span><input autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" /></label>
          <label><span className="field-label">Email address</span><input autoComplete="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
          <label><span className="field-label">Password</span><span className="password-field"><input autoComplete="new-password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
          <label><span className="field-label">Confirm password</span><input autoComplete="new-password" type={showPassword ? 'text' : 'password'} value={form.confirm} onChange={(event) => setForm({ ...form, confirm: event.target.value })} placeholder="Repeat your password" /></label>
          {error && <p role="alert" className="text-sm text-coral">{error}</p>}
          <button disabled={busy} className="button-primary w-full !justify-center !py-3">{busy ? 'Creating account…' : 'Create account'} {!busy && <MoveUpRight size={16} />}</button>
        </form>
        <p className="mt-5 text-center text-sm text-muted">Already have an account? <Link to="/login" className="font-semibold text-lime hover:text-lime/80">Sign in</Link></p>
        <p className="mt-5 text-center text-[11px] leading-relaxed text-muted/70">Your password is securely hashed by the ExpirEase backend.</p>
      </div>
    </AuthFrame>
  );
}
