import { Content, EditCtx, Me, localLogout } from '../lib/api';
import EditableText from './EditableText';

type Props = {
  me: Me;
  header: Content['header'];
  edit: EditCtx;
  editing: boolean;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onOpenSignups: () => void;
  onOpenLogin: () => void;
  onOpenAccount: () => void;
  onLoggedOut: () => void;
};

export default function AdminBar({
  me,
  header,
  edit,
  editing,
  saveState,
  onStartEdit,
  onCancel,
  onSave,
  onOpenSignups,
  onOpenLogin,
  onOpenAccount,
  onLoggedOut,
}: Props) {
  const loggedIn = !!me.user;
  const isAdmin = !!me.user?.isAdmin;
  const isLocal = me.user?.authSource === 'local';

  if (!me.oidcConfigured && !me.localAuthEnabled) {
    return (
      <div className="sticky top-0 z-50 bg-mustard/20 backdrop-blur border-b border-mustard/40 text-sm text-ink/80">
        <div className="max-w-6xl mx-auto px-4 py-1.5">
          Admin features disabled — set SESSION_SECRET to enable local login, or configure OIDC.
        </div>
      </div>
    );
  }

  async function onLogoutClick(e: React.MouseEvent) {
    if (!isLocal) return; // let the anchor navigate to /auth/logout for OIDC
    e.preventDefault();
    await localLogout().catch(() => {});
    onLoggedOut();
  }

  return (
    <div className="sticky top-0 z-50 bg-white/60 backdrop-blur border-b border-ink/5">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 text-sm">
        <EditableText
          canEdit={edit.canEdit}
          value={header.brand}
          onChange={(v) => edit.setField(['header', 'brand'], v)}
          className="font-display text-base"
        />
        <div className="flex-1" />
        {loggedIn && isAdmin && !editing && (
          <>
            <button className="btn-ghost !px-4 !py-1.5" onClick={onOpenSignups}>
              ☰ signups
            </button>
            <button className="btn-ghost !px-4 !py-1.5" onClick={onOpenAccount}>
              ⚙ account
            </button>
            <button className="btn-primary !px-4 !py-1.5" onClick={onStartEdit}>
              ✎ edit page
            </button>
          </>
        )}
        {loggedIn && isAdmin && editing && (
          <>
            <span className="text-ink/60">
              {saveState === 'saving' && 'saving…'}
              {saveState === 'saved' && 'saved ✓'}
              {saveState === 'error' && 'save failed'}
            </span>
            <button className="btn-ghost !px-4 !py-1.5" onClick={onCancel}>
              cancel
            </button>
            <button className="btn-primary !px-4 !py-1.5" onClick={onSave}>
              save
            </button>
          </>
        )}
        {loggedIn && !isAdmin && (
          <span className="text-ink/60">
            signed in as {me.user!.email || '(no email claim)'} — not an admin
          </span>
        )}
        {loggedIn ? (
          <a
            className="text-ink/60 hover:text-ink"
            href={isLocal ? '#' : '/auth/logout'}
            onClick={onLogoutClick}
          >
            log out
          </a>
        ) : (
          <>
            {me.localAuthEnabled && (
              <button className="text-ink/60 hover:text-ink" onClick={onOpenLogin}>
                admin log in
              </button>
            )}
            {me.oidcConfigured && (
              <a className="text-ink/60 hover:text-ink" href="/auth/login">
                {me.localAuthEnabled ? 'log in via SSO' : 'admin log in'}
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}
