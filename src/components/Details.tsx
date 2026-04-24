import { Content } from '../lib/api';
import EditableText from './EditableText';

type EditCtx = { canEdit: boolean; setField: (path: string[], value: string) => void };

function Row({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] md:grid-cols-[9rem_1fr] gap-4 items-baseline py-3 border-b border-ink/5 last:border-0">
      <dt className="text-xs uppercase tracking-widest text-ink/50">{label}</dt>
      <dd className="text-lg">{children}</dd>
    </div>
  );
}

export default function Details({ event, edit }: { event: Content['event']; edit: EditCtx }) {
  const field = (k: keyof Content['event']) => (
    <EditableText
      canEdit={edit.canEdit}
      value={event[k]}
      onChange={(v) => edit.setField(['event', k], v)}
    />
  );

  const note = (k: keyof Content['event']) => {
    if (!edit.canEdit && !event[k]) return null;
    return (
      <div className="mt-2 text-sm text-ink/60">
        <EditableText
          canEdit={edit.canEdit}
          value={event[k]}
          onChange={(v) => edit.setField(['event', k], v)}
          multiline
        />
      </div>
    );
  };

  return (
    <section id="details" className="relative max-w-6xl mx-auto px-6 py-16 md:py-24">
      <div className="grid md:grid-cols-5 gap-8 items-start">
        <div className="md:col-span-2">
          <EditableText
            as="div"
            canEdit={edit.canEdit}
            value={event.eyebrow}
            onChange={(v) => edit.setField(['event', 'eyebrow'], v)}
            className="text-xs uppercase tracking-widest text-coral mb-2"
          />
          <h2 className="text-4xl md:text-5xl font-display font-semibold leading-tight">
            <EditableText
              canEdit={edit.canEdit}
              value={event.heroLine1}
              onChange={(v) => edit.setField(['event', 'heroLine1'], v)}
            />
            <br />
            <EditableText
              canEdit={edit.canEdit}
              value={event.heroLine2}
              onChange={(v) => edit.setField(['event', 'heroLine2'], v)}
              className="italic text-terracotta"
            />
          </h2>
          <EditableText
            as="p"
            canEdit={edit.canEdit}
            value={event.heroBody}
            onChange={(v) => edit.setField(['event', 'heroBody'], v)}
            className="mt-6 text-ink/70 max-w-sm"
            multiline
          />
          <div className="mt-6 flex flex-wrap gap-2">
            <EditableText
              as="span"
              canEdit={edit.canEdit}
              value={event.tag1}
              onChange={(v) => edit.setField(['event', 'tag1'], v)}
              className="chip"
            />
            <EditableText
              as="span"
              canEdit={edit.canEdit}
              value={event.tag2}
              onChange={(v) => edit.setField(['event', 'tag2'], v)}
              className="chip"
            />
            <EditableText
              as="span"
              canEdit={edit.canEdit}
              value={event.tag3}
              onChange={(v) => edit.setField(['event', 'tag3'], v)}
              className="chip"
            />
          </div>
        </div>

        <div className="md:col-span-3 card p-8 md:p-10">
          <dl>
            <Row label={field('labelDate')}>{field('date')}</Row>
            <Row label={field('labelTalk')}>
              {field('talkTime')}
              <div className="mt-2 text-sm text-ink/60">
                <EditableText
                  canEdit={edit.canEdit}
                  value={event.talkNote}
                  onChange={(v) => edit.setField(['event', 'talkNote'], v)}
                  multiline
                />
              </div>
            </Row>
            <Row label={field('labelDance')}>
              {field('danceTime')}
              {note('danceNote')}
            </Row>
            <Row label={field('labelVenue')}>
              {field('venue')}
              <div className="mt-1 text-sm text-ink/60">
                <EditableText
                  canEdit={edit.canEdit}
                  value={event.address}
                  onChange={(v) => edit.setField(['event', 'address'], v)}
                  multiline
                />
              </div>
            </Row>
            <Row label={field('labelPrice')}>
              {field('price')}
              {note('priceNote')}
            </Row>
            <Row label={field('labelLiveMusic')}>
              {field('liveMusic')}
              {note('liveMusicNote')}
            </Row>
          </dl>
        </div>
      </div>
    </section>
  );
}
