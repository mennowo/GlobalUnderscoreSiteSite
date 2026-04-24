import { Content, EditCtx, EventRow } from '../lib/api';
import EditableText from './EditableText';

function randomId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function Details({ event, edit }: { event: Content['event']; edit: EditCtx }) {
  const rows = event.rows || [];

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
            {rows.map((row, i) => (
              <DetailRow
                key={row.id}
                row={row}
                index={i}
                total={rows.length}
                edit={edit}
              />
            ))}
          </dl>
          {edit.canEdit && (
            <div className="mt-4">
              <button
                type="button"
                className="btn-ghost !px-4 !py-1.5 text-sm"
                onClick={() =>
                  edit.updateDraft((d) => {
                    d.event.rows = [
                      ...(d.event.rows || []),
                      { id: randomId('row'), label: 'new', value: '' },
                    ];
                  })
                }
              >
                + add row
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function DetailRow({
  row,
  index,
  total,
  edit,
}: {
  row: EventRow;
  index: number;
  total: number;
  edit: EditCtx;
}) {
  const patch = (p: Partial<EventRow>) =>
    edit.updateDraft((d) => {
      const list = d.event.rows || [];
      const idx = list.findIndex((r) => r.id === row.id);
      if (idx < 0) return;
      list[idx] = { ...list[idx], ...p };
    });

  const move = (delta: number) =>
    edit.updateDraft((d) => {
      const list = d.event.rows || [];
      const i = list.findIndex((r) => r.id === row.id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j], list[i]];
    });

  const remove = () =>
    edit.updateDraft((d) => {
      d.event.rows = (d.event.rows || []).filter((r) => r.id !== row.id);
    });

  const showNote = edit.canEdit || !!row.note;

  return (
    <div className="grid grid-cols-[7.5rem_1fr] md:grid-cols-[9rem_1fr] gap-4 items-baseline py-3 border-b border-ink/5 last:border-0">
      <dt className="text-xs uppercase tracking-widest text-ink/50">
        <EditableText
          as="span"
          canEdit={edit.canEdit}
          value={row.label}
          onChange={(v) => patch({ label: v })}
        />
      </dt>
      <dd className="text-lg">
        {edit.canEdit && (
          <div className="flex items-center gap-2 mb-1 text-xs text-ink/50">
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
              title="remove row"
            >
              ×
            </button>
          </div>
        )}
        <EditableText
          canEdit={edit.canEdit}
          value={row.value}
          onChange={(v) => patch({ value: v })}
        />
        {showNote && (
          <div className="mt-1 text-sm text-ink/60">
            <EditableText
              canEdit={edit.canEdit}
              value={row.note ?? ''}
              onChange={(v) => patch({ note: v })}
              multiline
            />
          </div>
        )}
      </dd>
    </div>
  );
}
