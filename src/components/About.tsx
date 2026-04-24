import { Content, EditCtx } from '../lib/api';
import EditableText from './EditableText';

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
          <EditableText
            as="div"
            canEdit={edit.canEdit}
            value={about.eyebrow}
            onChange={(v) => edit.setField(['about', 'eyebrow'], v)}
            className="text-xs uppercase tracking-widest text-coral mb-3"
          />
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
            <EditableText
              canEdit={edit.canEdit}
              value={about.worldwideText}
              onChange={(v) => edit.setField(['about', 'worldwideText'], v)}
            />{' '}
            <a className="link" href={about.worldwideUrl} target="_blank" rel="noreferrer">
              <EditableText
                canEdit={edit.canEdit}
                value={about.worldwideLinkLabel}
                onChange={(v) => edit.setField(['about', 'worldwideLinkLabel'], v)}
              />
            </a>
            .
            {edit.canEdit && (
              <span className="block mt-2 text-xs text-ink/40">
                link url:{' '}
                <EditableText
                  canEdit={edit.canEdit}
                  value={about.worldwideUrl}
                  onChange={(v) => edit.setField(['about', 'worldwideUrl'], v)}
                />
              </span>
            )}
          </p>
        </div>

        <div className="card p-8 md:p-10 md:mt-20 md:rotate-[0.4deg]">
          <EditableText
            as="div"
            canEdit={edit.canEdit}
            value={what.eyebrow}
            onChange={(v) => edit.setField(['what', 'eyebrow'], v)}
            className="text-xs uppercase tracking-widest text-sage mb-3"
          />
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
