import { useCallback, useEffect, useMemo, useState } from 'react';
import { Content, Me, fetchContent, fetchMe, saveContent } from './lib/api';
import Hero from './components/Hero';
import About from './components/About';
import Details from './components/Details';
import Gallery from './components/Gallery';
import SignupForm from './components/SignupForm';
import AdminBar from './components/AdminBar';
import SignupsPanel from './components/SignupsPanel';
import BroadcastPanel from './components/BroadcastPanel';
import EmailSettingsPanel from './components/EmailSettingsPanel';
import LoginPanel from './components/LoginPanel';
import AccountPanel from './components/AccountPanel';
import Footer from './components/Footer';

export default function App() {
  const [content, setContent] = useState<Content | null>(null);
  const [me, setMe] = useState<Me>({ user: null, oidcConfigured: false, localAuthEnabled: false });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Content | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showSignups, setShowSignups] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [confirmedBanner, setConfirmedBanner] = useState<'ok' | 'invalid' | null>(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.has('confirmed')) return 'ok';
    if (p.get('confirm') === 'invalid' || p.get('confirm') === 'error') return 'invalid';
    return null;
  });

  const refreshMe = useCallback(() => {
    fetchMe()
      .then(setMe)
      .catch(() =>
        setMe({ user: null, oidcConfigured: false, localAuthEnabled: false }),
      );
  }, []);

  useEffect(() => {
    fetchContent().then(setContent).catch(console.error);
    refreshMe();
    if (confirmedBanner !== null) {
      const url = new URL(window.location.href);
      url.searchParams.delete('confirmed');
      url.searchParams.delete('confirm');
      window.history.replaceState({}, '', url.toString());
    }
  }, [refreshMe]);

  useEffect(() => {
    const url = content?.hero?.logoUrl;
    if (!url) return;
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) link.href = url;
  }, [content?.hero?.logoUrl]);

  const isAdmin = !!me.user?.isAdmin;
  const canEdit = isAdmin && editing;

  const startEdit = useCallback(() => {
    if (!content) return;
    setDraft(JSON.parse(JSON.stringify(content)));
    setEditing(true);
  }, [content]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setDraft(null);
    setSaveState('idle');
  }, []);

  const commitEdit = useCallback(async () => {
    if (!draft) return;
    setSaveState('saving');
    try {
      await saveContent(draft);
      setContent(draft);
      setEditing(false);
      setDraft(null);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1500);
    } catch (err) {
      console.error(err);
      setSaveState('error');
    }
  }, [draft]);

  const view = canEdit && draft ? draft : content;

  useEffect(() => {
    const title = view?.siteTitle;
    if (title) document.title = title;
  }, [view?.siteTitle]);

  const setField = useCallback(
    (path: string[], value: unknown) => {
      setDraft((prev) => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev));
        let cur: Record<string, unknown> = next;
        for (let i = 0; i < path.length - 1; i++) {
          cur = cur[path[i]] as Record<string, unknown>;
        }
        cur[path[path.length - 1]] = value;
        return next;
      });
    },
    [],
  );

  const updateDraft = useCallback((mutate: (draft: Content) => void) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev)) as Content;
      mutate(next);
      return next;
    });
  }, []);

  const editContext = useMemo(
    () => ({ canEdit, setField, updateDraft }),
    [canEdit, setField, updateDraft],
  );

  if (!view) {
    return (
      <div className="min-h-screen grid place-items-center text-ink/60">loading…</div>
    );
  }

  return (
    <>
      <AdminBar
        me={me}
        header={view.header}
        siteTitle={view.siteTitle}
        edit={editContext}
        editing={editing}
        saveState={saveState}
        onStartEdit={startEdit}
        onCancel={cancelEdit}
        onSave={commitEdit}
        onOpenSignups={() => setShowSignups(true)}
        onOpenBroadcast={() => setShowBroadcast(true)}
        onOpenEmailSettings={() => setShowEmailSettings(true)}
        onOpenLogin={() => setShowLogin(true)}
        onOpenAccount={() => setShowAccount(true)}
        onLoggedOut={refreshMe}
      />
      {confirmedBanner && (
        <div className={`px-4 py-3 text-sm text-center flex items-center justify-center gap-3 ${confirmedBanner === 'ok' ? 'bg-sage/20 text-ink' : 'bg-terracotta/10 text-terracotta'}`}>
          {confirmedBanner === 'ok'
            ? '✓ Your email is confirmed! Check your inbox for event details.'
            : 'That confirmation link is invalid or has already been used.'}
          <button onClick={() => setConfirmedBanner(null)} className="opacity-60 hover:opacity-100 text-base leading-none">×</button>
        </div>
      )}
      {showSignups && <SignupsPanel onClose={() => setShowSignups(false)} />}
      {showBroadcast && <BroadcastPanel onClose={() => setShowBroadcast(false)} />}
      {showEmailSettings && canEdit && (
        <EmailSettingsPanel
          email={view.email}
          edit={editContext}
          onClose={() => setShowEmailSettings(false)}
        />
      )}
      {showLogin && !me.user && (
        <LoginPanel
          onClose={() => setShowLogin(false)}
          onLoggedIn={() => {
            setShowLogin(false);
            refreshMe();
          }}
        />
      )}
      {showAccount && me.user && (
        <AccountPanel me={me.user} onClose={() => setShowAccount(false)} />
      )}
      <main className="relative">
        <Hero content={view.hero} edit={editContext} />
        <About about={view.about} edit={editContext} />
        <Gallery gallery={view.gallery} edit={editContext} />
        <Details event={view.event} edit={editContext} />
        <SignupForm closing={view.closing} signup={view.signup} edit={editContext} />
        <Footer footer={view.footer} edit={editContext} />
      </main>
    </>
  );
}
