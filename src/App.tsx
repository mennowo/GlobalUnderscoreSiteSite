import { useCallback, useEffect, useMemo, useState } from 'react';
import { Content, Me, fetchContent, fetchMe, saveContent } from './lib/api';
import Hero from './components/Hero';
import About from './components/About';
import Details from './components/Details';
import Gallery from './components/Gallery';
import SignupForm from './components/SignupForm';
import AdminBar from './components/AdminBar';
import SignupsPanel from './components/SignupsPanel';
import Footer from './components/Footer';

export default function App() {
  const [content, setContent] = useState<Content | null>(null);
  const [me, setMe] = useState<Me>({ user: null, oidcConfigured: false });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Content | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showSignups, setShowSignups] = useState(false);

  useEffect(() => {
    fetchContent().then(setContent).catch(console.error);
    fetchMe().then(setMe).catch(() => setMe({ user: null, oidcConfigured: false }));
  }, []);

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
        edit={editContext}
        editing={editing}
        saveState={saveState}
        onStartEdit={startEdit}
        onCancel={cancelEdit}
        onSave={commitEdit}
        onOpenSignups={() => setShowSignups(true)}
      />
      {showSignups && <SignupsPanel onClose={() => setShowSignups(false)} />}
      <main className="relative">
        <Hero content={view.hero} edit={editContext} />
        <About about={view.about} what={view.what} edit={editContext} />
        <Gallery gallery={view.gallery} edit={editContext} />
        <Details event={view.event} edit={editContext} />
        <SignupForm closing={view.closing} signup={view.signup} edit={editContext} />
        <Footer footer={view.footer} edit={editContext} />
      </main>
    </>
  );
}
