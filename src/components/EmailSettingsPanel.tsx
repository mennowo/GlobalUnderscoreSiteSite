import { EmailConfig, EditCtx } from '../lib/api';

type Props = {
  email: EmailConfig;
  edit: EditCtx;
  onClose: () => void;
};

type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  hint?: string;
};

function Field({ label, value, onChange, multiline, hint }: FieldProps) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={8}
          className="w-full rounded-xl border border-ink/15 bg-white/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-coral/40 resize-y font-mono"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-ink/15 bg-white/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-coral/40"
        />
      )}
      {hint && <p className="text-xs text-ink/40 mt-1">{hint}</p>}
    </div>
  );
}

export default function EmailSettingsPanel({ email, edit, onClose }: Props) {
  const set = (path: string[], v: string) => edit.setField(['email', ...path], v);

  return (
    <div className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm flex items-start md:items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[90vh] bg-cream rounded-3xl shadow-soft border border-white/60 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-ink/10">
          <h2 className="font-display text-2xl">Email settings</h2>
          <div className="flex-1" />
          <button onClick={onClose} className="text-ink/60 hover:text-ink text-xl leading-none px-2">×</button>
        </div>

        <div className="overflow-auto flex-1 p-6 flex flex-col gap-6">
          <Field
            label="From address"
            value={email.from}
            onChange={(v) => set(['from'], v)}
            hint="Must match a domain verified in Resend. E.g. Global Underscore Vienna <noreply@yourdomain.com>"
          />

          <div className="border-t border-ink/10 pt-6">
            <h3 className="font-display text-lg mb-4">Confirmation email</h3>
            <p className="text-xs text-ink/50 mb-4">Sent when someone signs up. Available placeholders: <code className="bg-sand/60 px-1 rounded">{'{{name}}'}</code>, <code className="bg-sand/60 px-1 rounded">{'{{confirmUrl}}'}</code></p>
            <div className="flex flex-col gap-4">
              <Field
                label="Subject"
                value={email.confirmation.subject}
                onChange={(v) => set(['confirmation', 'subject'], v)}
              />
              <Field
                label="Body"
                value={email.confirmation.body}
                onChange={(v) => set(['confirmation', 'body'], v)}
                multiline
              />
            </div>
          </div>

          <div className="border-t border-ink/10 pt-6">
            <h3 className="font-display text-lg mb-4">Welcome email</h3>
            <p className="text-xs text-ink/50 mb-4">Sent after the user clicks the confirmation link. Available placeholders: <code className="bg-sand/60 px-1 rounded">{'{{name}}'}</code></p>
            <div className="flex flex-col gap-4">
              <Field
                label="Subject"
                value={email.welcome.subject}
                onChange={(v) => set(['welcome', 'subject'], v)}
              />
              <Field
                label="Body"
                value={email.welcome.body}
                onChange={(v) => set(['welcome', 'body'], v)}
                multiline
              />
            </div>
          </div>

          <div className="border-t border-ink/10 pt-6">
            <h3 className="font-display text-lg mb-4">Admin notification email</h3>
            <p className="text-xs text-ink/50 mb-4">
              Sent to the listed addresses each time someone confirms their signup. Leave "To" blank to disable.
              Max 10 notifications per hour (server-side guard against abuse).
              Available placeholders: <code className="bg-sand/60 px-1 rounded">{'{{name}}'}</code>, <code className="bg-sand/60 px-1 rounded">{'{{totalSignups}}'}</code>, <code className="bg-sand/60 px-1 rounded">{'{{confirmedSignups}}'}</code>
            </p>
            <div className="flex flex-col gap-4">
              <Field
                label="To (comma-separated)"
                value={email.adminNotification.to}
                onChange={(v) => set(['adminNotification', 'to'], v)}
                hint="E.g. alice@example.com, bob@example.com — leave blank to disable."
              />
              <Field
                label="Subject"
                value={email.adminNotification.subject}
                onChange={(v) => set(['adminNotification', 'subject'], v)}
              />
              <Field
                label="Body"
                value={email.adminNotification.body}
                onChange={(v) => set(['adminNotification', 'body'], v)}
                multiline
              />
            </div>
          </div>

          <p className="text-xs text-ink/40 border-t border-ink/10 pt-4">
            Changes are saved when you click <strong>save</strong> in the admin bar.
          </p>
        </div>
      </div>
    </div>
  );
}
