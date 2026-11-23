import { useState } from 'react';
import { Eye, EyeOff, MoveUpRight } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useInventory } from '../context/InventoryContext';

export default function Login() {
  const { user, login, authLoading } = useInventory();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Enter a valid email address.');
    if (form.password.length < 8) return setError('Your password needs at least 8 characters.');
    setBusy(true);
    setError('');
    try {
      await login({ email: form.email.trim(), password: form.password });
      toast.success('Welcome back');
      navigate('/');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  if (authLoading) return <div className="auth-page items-center justify-center text-sm text-muted">Checking your session…</div>;
  return (
    <AuthFrame eyebrow="GOOD THINGS, WELL TIMED" title={<>A little more<br /><em>in the know.</em></>} description="Your shelves, a little more in sync. Keep the good things in circulation.">
      <div className="auth-form-wrap">
        <p className="eyebrow">YOUR PERSONAL SPACE</p><h2 className="mt-2 font-display text-2xl font-semibold">Welcome back</h2><p className="mt-2 text-sm text-muted">Sign in to pick up where you left off.</p>
        <form className="mt-7 space-y-4" onSubmit={submit}>
          <label><span className="field-label">Email address</span><input autoComplete="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
          <label><span className="field-label">Password</span><span className="password-field"><input autoComplete="current-password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
          {error && <p role="alert" className="text-sm text-coral">{error}</p>}
          <button disabled={busy} className="button-primary w-full !justify-center !py-3">{busy ? 'Signing in…' : 'Sign in'} {!busy && <MoveUpRight size={16} />}</button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">New around here? <Link to="/signup" className="font-semibold text-lime hover:text-lime/80">Create an account</Link></p>
        <p className="mt-7 text-center text-[11px] leading-relaxed text-muted/70">Your account is securely verified by the ExpirEase backend.</p>
      </div>
    </AuthFrame>
  );
}

export function AuthFrame({ children, eyebrow, title, description }) {
  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <Link to="/login" className="flex items-center gap-3"><span className="brand-mark"><span /></span><span className="font-display text-base font-bold">ExpirEase</span></Link>
        <div className="auth-brand-copy"><p className="eyebrow text-lime">{eyebrow}</p><h1>{title}</h1><p className="max-w-sm text-base leading-relaxed text-muted">{description}</p></div>
        <div className="auth-quote"><span className="quote-mark">“</span><p>Make room for what’s next.<br />Without forgetting what’s here.</p><span className="text-[10px] uppercase tracking-[.18em] text-muted">A calmer kind of keeping</span></div>
        <div className="auth-orbit"><div /><div /><div /></div>
      </section>
      <section className="auth-form-panel"><div className="auth-mobile-brand"><span className="brand-mark"><span /></span><span className="font-display font-bold">ExpirEase</span></div>{children}<p className="auth-legal">By continuing, you agree to keep your good things in good company.</p></section>
    </main>
  );
}
