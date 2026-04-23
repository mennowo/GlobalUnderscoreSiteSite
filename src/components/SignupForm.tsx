import { useEffect, useState } from 'react';
import { Content, fetchChallenge, submitSignup } from '../lib/api';
import EditableText from './EditableText';

type EditCtx = { canEdit: boolean; setField: (path: string[], value: string) => void };

export default function SignupForm({
  closing,
  edit,
}: {
  closing: Content['closing'];
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
          <div className="text-xs uppercase tracking-widest text-sage mb-2">join us</div>
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
              <h3 className="text-2xl font-display">You're in. 🌞</h3>
              <p className="mt-3 text-ink/70">
                We've noted your name down. See you on 20 June — come as you are.
              </p>
              <button
                type="button"
                className="btn-ghost mt-6"
                onClick={() => setState('idle')}
              >
                sign someone else up
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
                <span className="text-sm text-ink/70">your name</span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-ink/15 bg-white/80 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-coral"
                />
              </label>
              <label className="block mt-5">
                <span className="text-sm text-ink/70">email</span>
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
                  phone <span className="text-ink/40">(optional)</span>
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
                    I've danced an Underscore before
                    <span className="block text-sm text-ink/50 mt-0.5">
                      If not, don't worry — the talk at 15:00 is for you, and we're glad you're coming.
                    </span>
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
                    I have experience with Contact Improvisation
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
                    I <em>cannot</em> attend the Underscore talk before the jam
                    <span className="block text-sm text-ink/50 mt-0.5">
                      Heard it all before? We warmly invite you to join us nonetheless:
                      let's share our entry into the material.
                    </span>
                  </span>
                </label>
              </div>

              {err && <p className="mt-4 text-sm text-terracotta">{err}</p>}

              <button
                type="submit"
                disabled={state === 'sending'}
                className="btn-primary mt-6 w-full md:w-auto"
              >
                {state === 'sending' ? 'sending…' : 'count me in →'}
              </button>
              <p className="mt-4 text-xs text-ink/40">
                €25 at the door · cash or card · we'll send a friendly reminder a few days before.
              </p>
            </>
          )}
        </form>
      </div>
    </section>
  );
}
