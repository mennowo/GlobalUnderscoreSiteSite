import { useEffect, useState } from 'react';
import {
  AuthUser,
  ManagedUser,
  changePassword,
  createUser,
  deleteUser,
  listUsers,
} from '../lib/api';

export default function AccountPanel({
  me,
  onClose,
}: {
  me: AuthUser;
  onClose: () => void;
}) {
  const isLocal = me.authSource === 'local';
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  const [users, setUsers] = useState<ManagedUser[] | null>(null);
  const [usersErr, setUsersErr] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newUserPw, setNewUserPw] = useState('');
  const [addErr, setAddErr] = useState<string | null>(null);
  const [addBusy, setAddBusy] = useState(false);

  async function loadUsers() {
    setUsersErr(null);
    try {
      setUsers(await listUsers());
    } catch (e) {
      setUsersErr(e instanceof Error ? e.message : 'failed to load users');
    }
  }

  useEffect(() => {
    if (isLocal) loadUsers();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isLocal, onClose]);

  async function onChangePw(e: React.FormEvent) {
    e.preventDefault();
    setPwErr(null);
    setPwMsg(null);
    setPwBusy(true);
    try {
      await changePassword(currentPw, newPw);
      setPwMsg('password changed');
      setCurrentPw('');
      setNewPw('');
    } catch (e) {
      setPwErr(e instanceof Error ? e.message : 'failed');
    } finally {
      setPwBusy(false);
    }
  }

  async function onAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAddErr(null);
    setAddBusy(true);
    try {
      await createUser(newEmail, newUserPw);
      setNewEmail('');
      setNewUserPw('');
      await loadUsers();
    } catch (e) {
      setAddErr(e instanceof Error ? e.message : 'failed');
    } finally {
      setAddBusy(false);
    }
  }

  async function onDeleteUser(id: number, email: string) {
    if (!confirm(`Remove admin ${email}?`)) return;
    try {
      await deleteUser(id);
      await loadUsers();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'delete failed');
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm flex items-start md:items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[90vh] bg-cream rounded-3xl shadow-soft border border-white/60 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-ink/10">
          <h2 className="font-display text-2xl">Account</h2>
          <span className="chip text-xs">{me.email}</span>
          <span className="chip text-xs">{me.authSource}</span>
          <div className="flex-1" />
          <button onClick={onClose} className="text-ink/60 hover:text-ink text-xl leading-none px-2">
            ×
          </button>
        </div>

        <div className="overflow-auto flex-1 p-6 space-y-8">
          <section>
            <h3 className="font-display text-lg mb-3">Password</h3>
            {!isLocal ? (
              <p className="text-ink/60 text-sm">
                Your account is managed by your identity provider. Change your password there.
              </p>
            ) : (
              <form onSubmit={onChangePw} className="space-y-3 max-w-md">
                <label className="block">
                  <span className="text-xs uppercase tracking-widest text-ink/60">Current password</span>
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-ink/10 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral/40"
                  />
                </label>
                <label className="block">
                  <span className="text-xs uppercase tracking-widest text-ink/60">New password (min 8 chars)</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-ink/10 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral/40"
                  />
                </label>
                {pwErr && <div className="text-terracotta text-sm">{pwErr}</div>}
                {pwMsg && <div className="text-sage text-sm">{pwMsg}</div>}
                <button type="submit" className="btn-primary !px-4 !py-1.5" disabled={pwBusy}>
                  {pwBusy ? 'saving…' : 'change password'}
                </button>
              </form>
            )}
          </section>

          {isLocal && (
            <section>
              <h3 className="font-display text-lg mb-3">Admins</h3>
              {usersErr && <div className="text-terracotta text-sm mb-2">{usersErr}</div>}
              {users === null && !usersErr && <div className="text-ink/60 text-sm">loading…</div>}
              {users && (
                <table className="w-full text-sm mb-4">
                  <thead>
                    <tr className="text-left text-ink/60 text-xs uppercase tracking-widest">
                      <th className="py-2 font-medium">email</th>
                      <th className="py-2 font-medium">added</th>
                      <th className="py-2 font-medium w-px"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-t border-ink/5">
                        <td className="py-2">{u.email}</td>
                        <td className="py-2 text-ink/60">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="py-2">
                          <button
                            onClick={() => onDeleteUser(u.id, u.email)}
                            className="text-ink/40 hover:text-terracotta text-sm"
                          >
                            remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <form onSubmit={onAddUser} className="space-y-3 max-w-md border-t border-ink/10 pt-4">
                <p className="text-xs uppercase tracking-widest text-ink/60">Add admin</p>
                <input
                  type="email"
                  required
                  placeholder="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-xl border border-ink/10 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral/40"
                />
                <input
                  type="text"
                  required
                  minLength={8}
                  placeholder="initial password (min 8 chars)"
                  value={newUserPw}
                  onChange={(e) => setNewUserPw(e.target.value)}
                  className="w-full rounded-xl border border-ink/10 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral/40"
                />
                {addErr && <div className="text-terracotta text-sm">{addErr}</div>}
                <button type="submit" className="btn-primary !px-4 !py-1.5" disabled={addBusy}>
                  {addBusy ? 'adding…' : 'add admin'}
                </button>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
