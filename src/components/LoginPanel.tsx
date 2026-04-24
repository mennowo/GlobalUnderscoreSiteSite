import { useState } from 'react';
import { localLogin } from '../lib/api';

export default function LoginPanel({
  onClose,
  onLoggedIn,
}: {
  onClose: () => void;
  onLoggedIn: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await localLogin(email, password);
      onLoggedIn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm flex items-start md:items-center justify-center p-4">
      <div className="w-full max-w-md bg-cream rounded-3xl shadow-soft border border-white/60 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-ink/10">
          <h2 className="font-display text-2xl">Admin log in</h2>
          <div className="flex-1" />
          <button onClick={onClose} className="text-ink/60 hover:text-ink text-xl leading-none px-2">
            ×
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-ink/60">Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-ink/10 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral/40"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-ink/60">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-ink/10 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral/40"
            />
          </label>
          {err && <div className="text-terracotta text-sm">{err}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-ghost !px-4 !py-1.5" onClick={onClose}>
              cancel
            </button>
            <div className="flex-1" />
            <button type="submit" className="btn-primary !px-4 !py-1.5" disabled={busy}>
              {busy ? 'signing in…' : 'sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
