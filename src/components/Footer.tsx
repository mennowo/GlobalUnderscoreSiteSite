import { Content } from '../lib/api';
import EditableText from './EditableText';

type EditCtx = { canEdit: boolean; setField: (path: string[], value: string) => void };

export default function Footer({ footer, edit }: { footer: Content['footer']; edit: EditCtx }) {
  return (
    <footer className="mt-16 border-t border-ink/10 bg-sand/60">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center gap-4 text-sm text-ink/60">
        <EditableText
          canEdit={edit.canEdit}
          value={footer.brand}
          onChange={(v) => edit.setField(['footer', 'brand'], v)}
          className="font-display text-ink text-base"
        />
        <div className="flex-1" />
        <EditableText
          canEdit={edit.canEdit}
          value={footer.tagline}
          onChange={(v) => edit.setField(['footer', 'tagline'], v)}
        />
        <span className="hidden md:inline">·</span>
        <a className="link" href="https://globalunderscore.com/" target="_blank" rel="noreferrer">
          globalunderscore.com
        </a>
      </div>
    </footer>
  );
}
