import { Content } from '../lib/api';
import EditableText from './EditableText';

type EditCtx = { canEdit: boolean; setField: (path: string[], value: string) => void };

export default function About({
  about,
  what,
  edit,
}: {
  about: Content['about'];
  what: Content['what'];
  edit: EditCtx;
}) {
  return (
    <section id="about" className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16">
        <div className="card p-8 md:p-10">
          <div className="text-xs uppercase tracking-widest text-coral mb-3">the score</div>
          <h2 className="text-3xl md:text-4xl font-display font-semibold">
            <EditableText
              canEdit={edit.canEdit}
              value={about.heading}
              onChange={(v) => edit.setField(['about', 'heading'], v)}
            />
          </h2>
          <EditableText
            as="div"
            canEdit={edit.canEdit}
            value={about.body}
            onChange={(v) => edit.setField(['about', 'body'], v)}
            className="mt-5 text-ink/80 leading-relaxed"
            multiline
          />
          <p className="mt-6 text-sm text-ink/50">
            More on the worldwide event at{' '}
            <a className="link" href="https://globalunderscore.com/" target="_blank" rel="noreferrer">
              globalunderscore.com
            </a>
            .
          </p>
        </div>

        <div className="card p-8 md:p-10 md:mt-20 md:rotate-[0.4deg]">
          <div className="text-xs uppercase tracking-widest text-sage mb-3">the form</div>
          <h2 className="text-3xl md:text-4xl font-display font-semibold">
            <EditableText
              canEdit={edit.canEdit}
              value={what.heading}
              onChange={(v) => edit.setField(['what', 'heading'], v)}
            />
          </h2>
          <EditableText
            as="div"
            canEdit={edit.canEdit}
            value={what.body}
            onChange={(v) => edit.setField(['what', 'body'], v)}
            className="mt-5 text-ink/80 leading-relaxed"
            multiline
          />
        </div>
      </div>
    </section>
  );
}
