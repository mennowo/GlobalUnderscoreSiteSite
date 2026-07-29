import { useState } from 'react';
import { broadcastEmail } from '../lib/api';

export default function BroadcastPanel({ onClose }: { onClose: () => void }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<'confirmed' | 'all'>('confirmed');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<{ sent: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSend() {
    if (!subject.trim() || !body.trim()) return;
    if (!confirm(`Send to ${audience === 'confirmed' ? 'confirmed signups only' : 'all signups'}?`)) return;
    setState('sending');
    setErr(null);
    try {
      const res = await broadcastEmail({ subject, body, audience });
      setResult(res);
      setState('done');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'send failed');
      setState('error');
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm flex items-start md:items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[90vh] bg-cream rounded-3xl shadow-soft border border-white/60 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-ink/10">
          <h2 className="font-display text-2xl">Broadcast email</h2>
          <div className="flex-1" />
          <button onClick={onClose} className="text-ink/60 hover:text-ink text-xl leading-none px-2">×</button>
        </div>

        <div className="overflow-auto flex-1 p-6 flex flex-col gap-4">
          {state === 'done' ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">✓</p>
              <p className="font-display text-lg">Sent to {result?.sent} recipient{result?.sent === 1 ? '' : 's'}.</p>
              <button className="btn-ghost mt-6 !px-6 !py-2" onClick={onClose}>close</button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Send to</label>
                <div className="flex gap-3">
                  {(['confirmed', 'all'] as const).map((v) => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="audience"
                        value={v}
                        checked={audience === v}
                        onChange={() => setAudience(v)}
                        className="accent-coral"
                      />
                      <span className="text-sm">{v === 'confirmed' ? 'Confirmed signups only' : 'All signups (including unconfirmed)'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject…"
                  className="w-full rounded-xl border border-ink/15 bg-white/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-coral/40"
                />
              </div>

              <div className="flex-1">
                <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Body</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your email…"
                  rows={10}
                  className="w-full rounded-xl border border-ink/15 bg-white/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-coral/40 resize-y"
                />
              </div>

              {state === 'error' && <p className="text-terracotta text-sm">{err}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button className="btn-ghost !px-6 !py-2" onClick={onClose} disabled={state === 'sending'}>cancel</button>
                <button
                  className="btn-primary !px-6 !py-2"
                  onClick={onSend}
                  disabled={state === 'sending' || !subject.trim() || !body.trim()}
                >
                  {state === 'sending' ? 'sending…' : 'send →'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
