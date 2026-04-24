import { useEffect, useState } from 'react';
import { Content, fetchChallenge, submitSignup } from '../lib/api';
import EditableText from './EditableText';

type EditCtx = { canEdit: boolean; setField: (path: string[], value: string) => void };

export default function SignupForm({
  closing,
  signup,
  edit,
}: {
  closing: Content['closing'];
  signup: Content['signup'];
  edit: EditCtx;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [didBefore, setDidBefore] = useState(false);
  const [hasCi, setHasCi] = useState(false);
  const [noTalk, setNoTalk] = useState(false);
  const [hp, setHp] = useState(''); // honeypot — must stay empty
  const [token, setToken] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [err, setErr] = useState('');

  useEffect(() => {
    fetchChallenge().then((c) => setToken(c.token)).catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    setErr('');
    try {
      await submitSignup({
        name,
        email,
        phone,
        didUnderscoreBefore: didBefore,
        hasCiExperience: hasCi,
        cannotAttendTalk: noTalk,
        hp,
        token,
      });
      setState('done');
      setName('');
      setEmail('');
      setPhone('');
      setDidBefore(false);
      setHasCi(false);
      setNoTalk(false);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'something went wrong');
      setState('error');
      // refresh token on failure in case it expired
      fetchChallenge().then((c) => setToken(c.token)).catch(() => {});
    }
  }

  return (
    <section id="signup" className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
      <div className="grid md:grid-cols-5 gap-10 md:gap-16 items-start">
        <div className="md:col-span-2">
          <EditableText
            as="div"
            canEdit={edit.canEdit}
            value={closing.eyebrow}
            onChange={(v) => edit.setField(['closing', 'eyebrow'], v)}
            className="text-xs uppercase tracking-widest text-sage mb-2"
          />
          <h2 className="text-4xl md:text-5xl font-display font-semibold">
            <EditableText
              canEdit={edit.canEdit}
              value={closing.heading}
              onChange={(v) => edit.setField(['closing', 'heading'], v)}
            />
          </h2>
          <EditableText
            as="div"
            canEdit={edit.canEdit}
            value={closing.body}
            onChange={(v) => edit.setField(['closing', 'body'], v)}
            className="mt-5 text-ink/80 leading-relaxed"
            multiline
          />
        </div>

        <form
          onSubmit={onSubmit}
          className="md:col-span-3 card p-8 md:p-10 md:-rotate-[0.3deg]"
        >
          {state === 'done' ? (
            <div className="py-6">
              <h3 className="text-2xl font-display">
                <EditableText
                  canEdit={edit.canEdit}
                  value={signup.successHeading}
                  onChange={(v) => edit.setField(['signup', 'successHeading'], v)}
                />
              </h3>
              <EditableText
                as="p"
                canEdit={edit.canEdit}
                value={signup.successBody}
                onChange={(v) => edit.setField(['signup', 'successBody'], v)}
                className="mt-3 text-ink/70"
                multiline
              />
              <button
                type="button"
                className="btn-ghost mt-6"
                onClick={() => setState('idle')}
              >
                <EditableText
                  canEdit={edit.canEdit}
                  value={signup.successButton}
                  onChange={(v) => edit.setField(['signup', 'successButton'], v)}
                />
              </button>
            </div>
          ) : (
            <>
              {/* honeypot — hidden from humans, filled by naive bots */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: '-9999px',
                  width: '1px',
                  height: '1px',
                  overflow: 'hidden',
                }}
              >
                <label>
                  Website (leave empty)
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={hp}
                    onChange={(e) => setHp(e.target.value)}
                  />
                </label>
              </div>

              <label className="block">
                <EditableText
                  as="span"
                  canEdit={edit.canEdit}
                  value={signup.nameLabel}
                  onChange={(v) => edit.setField(['signup', 'nameLabel'], v)}
                  className="text-sm text-ink/70"
                />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-ink/15 bg-white/80 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-coral"
                />
              </label>
              <label className="block mt-5">
                <EditableText
                  as="span"
                  canEdit={edit.canEdit}
                  value={signup.emailLabel}
                  onChange={(v) => edit.setField(['signup', 'emailLabel'], v)}
                  className="text-sm text-ink/70"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-ink/15 bg-white/80 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-coral"
                />
              </label>
              <label className="block mt-5">
                <span className="text-sm text-ink/70">
                  <EditableText
                    canEdit={edit.canEdit}
                    value={signup.phoneLabel}
                    onChange={(v) => edit.setField(['signup', 'phoneLabel'], v)}
                  />{' '}
                  <EditableText
                    canEdit={edit.canEdit}
                    value={signup.phoneOptional}
                    onChange={(v) => edit.setField(['signup', 'phoneOptional'], v)}
                    className="text-ink/40"
                  />
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  className="mt-1 w-full rounded-xl border border-ink/15 bg-white/80 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-coral"
                />
              </label>

              <div className="mt-6 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={didBefore}
                    onChange={(e) => setDidBefore(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-coral"
                  />
                  <span className="text-ink/80">
                    <EditableText
                      canEdit={edit.canEdit}
                      value={signup.didBeforeLabel}
                      onChange={(v) => edit.setField(['signup', 'didBeforeLabel'], v)}
                    />
                    <EditableText
                      as="span"
                      canEdit={edit.canEdit}
                      value={signup.didBeforeNote}
                      onChange={(v) => edit.setField(['signup', 'didBeforeNote'], v)}
                      className="block text-sm text-ink/50 mt-0.5"
                      multiline
                    />
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasCi}
                    onChange={(e) => setHasCi(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-coral"
                  />
                  <span className="text-ink/80">
                    <EditableText
                      canEdit={edit.canEdit}
                      value={signup.hasCiLabel}
                      onChange={(v) => edit.setField(['signup', 'hasCiLabel'], v)}
                    />
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noTalk}
                    onChange={(e) => setNoTalk(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-coral"
                  />
                  <span className="text-ink/80">
                    <EditableText
                      canEdit={edit.canEdit}
                      value={signup.noTalkLabel}
                      onChange={(v) => edit.setField(['signup', 'noTalkLabel'], v)}
                    />
                    <EditableText
                      as="span"
                      canEdit={edit.canEdit}
                      value={signup.noTalkNote}
                      onChange={(v) => edit.setField(['signup', 'noTalkNote'], v)}
                      className="block text-sm text-ink/50 mt-0.5"
                      multiline
                    />
                  </span>
                </label>
              </div>

              {err && <p className="mt-4 text-sm text-terracotta">{err}</p>}

              <button
                type="submit"
                disabled={state === 'sending'}
                className="btn-primary mt-6 w-full md:w-auto"
              >
                <EditableText
                  canEdit={edit.canEdit}
                  value={state === 'sending' ? signup.submittingLabel : signup.submitLabel}
                  onChange={(v) =>
                    edit.setField(
                      ['signup', state === 'sending' ? 'submittingLabel' : 'submitLabel'],
                      v,
                    )
                  }
                />
              </button>
              <EditableText
                as="p"
                canEdit={edit.canEdit}
                value={signup.footnote}
                onChange={(v) => edit.setField(['signup', 'footnote'], v)}
                className="mt-4 text-xs text-ink/40"
                multiline
              />
            </>
          )}
        </form>
      </div>
    </section>
  );
}
