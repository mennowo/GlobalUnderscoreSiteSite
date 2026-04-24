import { useEffect, useState } from 'react';
import { Signup, SignupField, deleteSignup, fetchSignups } from '../lib/api';

function formatCell(field: SignupField, v: string | boolean | undefined) {
  if (field.kind === 'checkbox') {
    return v ? (
      <span className="chip !bg-sage/20 text-xs">yes</span>
    ) : (
      <span className="text-ink/30">—</span>
    );
  }
  const s = typeof v === 'string' ? v : v == null ? '' : String(v);
  if (!s) return <span className="text-ink/30">—</span>;
  if (field.kind === 'email') {
    return (
      <a href={`mailto:${s}`} className="link">
        {s}
      </a>
    );
  }
  if (field.kind === 'phone') {
    return (
      <a href={`tel:${s}`} className="link">
        {s}
      </a>
    );
  }
  if (field.kind === 'radio') {
    const label = field.options?.find((o) => o.id === s)?.label || s;
    return <span>{label}</span>;
  }
  return <span className="whitespace-pre-wrap">{s}</span>;
}

export default function SignupsPanel({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState<Signup[] | null>(null);
  const [fields, setFields] = useState<SignupField[]>([]);
  const [count, setCount] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setErr(null);
    try {
      const data = await fetchSignups();
      setRows(data.rows);
      setFields(data.fields);
      setCount(data.count);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'failed');
    }
  }

  useEffect(() => {
    load();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function onDelete(id: number) {
    if (!confirm('Remove this signup?')) return;
    setBusy(true);
    try {
      await deleteSignup(id);
      await load();
    } finally {
      setBusy(false);
    }
  }

  const checkboxFields = fields.filter((f) => f.kind === 'checkbox');

  return (
    <div className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm flex items-start md:items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[90vh] bg-cream rounded-3xl shadow-soft border border-white/60 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-ink/10 flex-wrap">
          <h2 className="font-display text-2xl">Signups</h2>
          <span className="chip text-xs">{count} total</span>
          {checkboxFields.map((f) => (
            <span key={f.id} className="chip text-xs">
              {rows?.filter((r) => !!r.data?.[f.id]).length ?? 0} {f.label.toLowerCase()}
            </span>
          ))}
          <div className="flex-1" />
          <a href="/api/signups.csv" className="btn-ghost !px-4 !py-1.5 text-sm">
            ↓ CSV
          </a>
          <button onClick={load} className="btn-ghost !px-4 !py-1.5 text-sm" disabled={busy}>
            refresh
          </button>
          <button onClick={onClose} className="text-ink/60 hover:text-ink text-xl leading-none px-2">
            ×
          </button>
        </div>

        <div className="overflow-auto flex-1">
          {err && <div className="p-6 text-terracotta">{err}</div>}
          {!err && rows === null && <div className="p-6 text-ink/60">loading…</div>}
          {!err && rows?.length === 0 && (
            <div className="p-10 text-center text-ink/60">
              No signups yet. When someone submits the form, they'll appear here.
            </div>
          )}
          {rows && rows.length > 0 && (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-sand/90 backdrop-blur">
                <tr className="text-left text-ink/60 text-xs uppercase tracking-widest">
                  <th className="px-4 py-3 font-medium">when</th>
                  {fields.map((f) => (
                    <th key={f.id} className="px-4 py-3 font-medium">
                      {f.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-medium w-px"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-ink/5 hover:bg-white/40">
                    <td className="px-4 py-3 text-ink/60 whitespace-nowrap">
                      {new Date(r.ts).toLocaleString()}
                    </td>
                    {fields.map((f) => (
                      <td key={f.id} className="px-4 py-3 align-top">
                        {formatCell(f, r.data?.[f.id])}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onDelete(r.id)}
                        disabled={busy}
                        className="text-ink/40 hover:text-terracotta text-sm"
                        title="Delete"
                      >
                        remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
