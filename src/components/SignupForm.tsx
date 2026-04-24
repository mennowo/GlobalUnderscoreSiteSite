import { useEffect, useState } from 'react';
import {
  Content,
  EditCtx,
  SignupField,
  SignupFieldKind,
  fetchChallenge,
  submitSignup,
} from '../lib/api';
import EditableText from './EditableText';

const FIELD_KIND_OPTIONS: { value: SignupFieldKind; label: string }[] = [
  { value: 'text', label: 'single-line text' },
  { value: 'multiline', label: 'multi-line text' },
  { value: 'email', label: 'email' },
  { value: 'phone', label: 'phone' },
  { value: 'checkbox', label: 'checkbox' },
  { value: 'radio', label: 'radio buttons' },
];

function randomId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function defaultValueFor(kind: SignupFieldKind): string | boolean {
  return kind === 'checkbox' ? false : '';
}

export default function SignupForm({
  closing,
  signup,
  edit,
}: {
  closing: Content['closing'];
  signup: Content['signup'];
  edit: EditCtx;
}) {
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [hp, setHp] = useState('');
  const [token, setToken] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [err, setErr] = useState('');

  useEffect(() => {
    fetchChallenge().then((c) => setToken(c.token)).catch(() => {});
  }, []);

  const fields = signup.fields || [];

  function getValue(field: SignupField): string | boolean {
    const v = values[field.id];
    if (v === undefined) return defaultValueFor(field.kind);
    return v;
  }

  function setValue(id: string, v: string | boolean) {
    setValues((prev) => ({ ...prev, [id]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (edit.canEdit) return; // don't actually submit while editing
    setState('sending');
    setErr('');
    try {
      const data: Record<string, string | boolean> = {};
      for (const f of fields) data[f.id] = getValue(f);
      await submitSignup({ data, hp, token });
      setState('done');
      setValues({});
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'something went wrong');
      setState('error');
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

              <div className="space-y-5">
                {fields.map((f, i) => (
                  <FieldEditor
                    key={f.id}
                    field={f}
                    index={i}
                    total={fields.length}
                    value={getValue(f)}
                    onChange={(v) => setValue(f.id, v)}
                    edit={edit}
                  />
                ))}
              </div>

              {edit.canEdit && (
                <div className="mt-5">
                  <button
                    type="button"
                    className="btn-ghost !px-4 !py-1.5 text-sm"
                    onClick={() =>
                      edit.updateDraft((d) => {
                        d.signup.fields = [
                          ...(d.signup.fields || []),
                          {
                            id: randomId('field'),
                            kind: 'text',
                            label: 'new field',
                          },
                        ];
                      })
                    }
                  >
                    + add field
                  </button>
                </div>
              )}

              {err && <p className="mt-4 text-sm text-terracotta">{err}</p>}

              <button
                type="submit"
                disabled={state === 'sending' || edit.canEdit}
                className="btn-primary mt-6 w-full md:w-auto"
                title={edit.canEdit ? 'submit disabled while editing' : undefined}
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

function FieldEditor({
  field,
  index,
  total,
  value,
  onChange,
  edit,
}: {
  field: SignupField;
  index: number;
  total: number;
  value: string | boolean;
  onChange: (v: string | boolean) => void;
  edit: EditCtx;
}) {
  const patchField = (patch: Partial<SignupField>) =>
    edit.updateDraft((d) => {
      const list = d.signup.fields || [];
      const idx = list.findIndex((x) => x.id === field.id);
      if (idx < 0) return;
      list[idx] = { ...list[idx], ...patch };
    });

  const setLabel = (v: string) => patchField({ label: v });
  const setNote = (v: string) => patchField({ note: v });

  return (
    <div className={edit.canEdit ? 'rounded-xl ring-1 ring-ink/10 p-3 bg-white/40' : ''}>
      {edit.canEdit && (
        <FieldToolbar field={field} index={index} total={total} edit={edit} />
      )}
      <FieldControl
        field={field}
        value={value}
        onChange={onChange}
        canEdit={edit.canEdit}
        setLabel={setLabel}
        setNote={setNote}
      />
      {edit.canEdit && field.kind === 'radio' && (
        <RadioOptionsEditor field={field} edit={edit} />
      )}
    </div>
  );
}

function FieldToolbar({
  field,
  index,
  total,
  edit,
}: {
  field: SignupField;
  index: number;
  total: number;
  edit: EditCtx;
}) {
  const move = (delta: number) =>
    edit.updateDraft((d) => {
      const list = d.signup.fields || [];
      const i = list.findIndex((x) => x.id === field.id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j], list[i]];
    });

  const remove = () =>
    edit.updateDraft((d) => {
      d.signup.fields = (d.signup.fields || []).filter((x) => x.id !== field.id);
    });

  const setKind = (kind: SignupFieldKind) =>
    edit.updateDraft((d) => {
      const list = d.signup.fields || [];
      const idx = list.findIndex((x) => x.id === field.id);
      if (idx < 0) return;
      const prev = list[idx];
      const next: SignupField = { ...prev, kind };
      if (kind === 'radio' && !next.options?.length) {
        next.options = [
          { id: randomId('opt'), label: 'option one' },
          { id: randomId('opt'), label: 'option two' },
        ];
      }
      if (kind !== 'radio') delete next.options;
      list[idx] = next;
    });

  const toggleRequired = () =>
    edit.updateDraft((d) => {
      const list = d.signup.fields || [];
      const idx = list.findIndex((x) => x.id === field.id);
      if (idx < 0) return;
      list[idx] = { ...list[idx], required: !list[idx].required };
    });

  return (
    <div className="flex items-center flex-wrap gap-2 mb-2 text-xs text-ink/60">
      <select
        value={field.kind}
        onChange={(e) => setKind(e.target.value as SignupFieldKind)}
        className="rounded-md border border-ink/15 bg-white/80 px-2 py-1 text-xs"
      >
        {FIELD_KIND_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <label className="inline-flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={!!field.required}
          onChange={toggleRequired}
          className="accent-coral"
        />
        required
      </label>
      <span className="text-ink/30">·</span>
      <button
        type="button"
        className="px-1.5 py-0.5 hover:text-ink disabled:opacity-30"
        onClick={() => move(-1)}
        disabled={index === 0}
        title="move up"
      >
        ↑
      </button>
      <button
        type="button"
        className="px-1.5 py-0.5 hover:text-ink disabled:opacity-30"
        onClick={() => move(1)}
        disabled={index >= total - 1}
        title="move down"
      >
        ↓
      </button>
      <button
        type="button"
        className="px-1.5 py-0.5 hover:text-terracotta"
        onClick={remove}
        title="remove field"
      >
        ×
      </button>
      <span className="flex-1" />
      <span className="text-ink/30 text-[10px] font-mono">id: {field.id}</span>
    </div>
  );
}

function FieldControl({
  field,
  value,
  onChange,
  canEdit,
  setLabel,
  setNote,
}: {
  field: SignupField;
  value: string | boolean;
  onChange: (v: string | boolean) => void;
  canEdit: boolean;
  setLabel: (v: string) => void;
  setNote: (v: string) => void;
}) {
  // text/email/phone/multiline want a small caption label above the input;
  // checkbox/radio labels read at body size alongside the control.
  const isControlGroup = field.kind === 'checkbox' || field.kind === 'radio';
  const labelNode = (
    <EditableText
      as="span"
      canEdit={canEdit}
      value={field.label}
      onChange={setLabel}
      className={isControlGroup ? '' : 'text-sm text-ink/70'}
    />
  );

  const noteNode =
    canEdit || field.note ? (
      <EditableText
        as="span"
        canEdit={canEdit}
        value={field.note ?? ''}
        onChange={setNote}
        className="block text-sm text-ink/50 mt-0.5"
        multiline
      />
    ) : null;

  if (field.kind === 'checkbox') {
    return (
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 w-5 h-5 shrink-0 accent-coral"
        />
        <span className="text-ink/80">
          {labelNode}
          {noteNode}
        </span>
      </label>
    );
  }

  if (field.kind === 'radio') {
    return (
      <div>
        <div className="text-ink/80">{labelNode}</div>
        <div className="mt-2 space-y-2">
          {(field.options || []).map((o) => (
            <label key={o.id} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name={field.id}
                checked={value === o.id}
                onChange={() => onChange(o.id)}
                className="w-4 h-4 shrink-0 accent-coral"
              />
              <span className="text-ink/80">{o.label}</span>
            </label>
          ))}
        </div>
        {noteNode}
      </div>
    );
  }

  const inputType = field.kind === 'email' ? 'email' : field.kind === 'phone' ? 'tel' : 'text';
  const inputCommon =
    'mt-1 w-full rounded-xl border border-ink/15 bg-white/80 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-coral';

  return (
    <label className="block">
      {labelNode}
      {field.kind === 'multiline' ? (
        <textarea
          required={field.required}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className={inputCommon}
        />
      ) : (
        <input
          type={inputType}
          required={field.required}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={field.kind === 'phone' ? 'tel' : undefined}
          className={inputCommon}
        />
      )}
      {noteNode}
    </label>
  );
}

function RadioOptionsEditor({ field, edit }: { field: SignupField; edit: EditCtx }) {
  const mutate = (fn: (opts: NonNullable<SignupField['options']>) => void) =>
    edit.updateDraft((d) => {
      const list = d.signup.fields || [];
      const idx = list.findIndex((x) => x.id === field.id);
      if (idx < 0) return;
      const opts = list[idx].options ? [...list[idx].options!] : [];
      fn(opts);
      list[idx] = { ...list[idx], options: opts };
    });

  return (
    <div className="mt-3 pl-7 space-y-1.5 text-xs text-ink/60">
      <div className="text-[10px] uppercase tracking-widest text-ink/40">options</div>
      {(field.options || []).map((o, i) => (
        <div key={o.id} className="flex items-center gap-2">
          <EditableText
            as="span"
            canEdit
            value={o.label}
            onChange={(v) =>
              mutate((opts) => {
                opts[i] = { ...opts[i], label: v };
              })
            }
            className="text-ink/80 flex-1"
          />
          <button
            type="button"
            className="hover:text-terracotta px-1"
            onClick={() =>
              mutate((opts) => {
                opts.splice(i, 1);
              })
            }
            title="remove option"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn-ghost !px-3 !py-1 text-xs"
        onClick={() =>
          mutate((opts) => {
            opts.push({ id: randomId('opt'), label: 'new option' });
          })
        }
      >
        + option
      </button>
    </div>
  );
}
