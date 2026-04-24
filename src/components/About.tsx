import { AboutBlock, BlockAccent, Content, EditCtx } from '../lib/api';
import EditableText from './EditableText';

const ACCENT_OPTIONS: { value: BlockAccent; label: string; className: string }[] = [
  { value: 'coral', label: 'coral', className: 'text-coral' },
  { value: 'sage', label: 'sage', className: 'text-sage' },
  { value: 'mustard', label: 'mustard', className: 'text-mustard' },
  { value: 'terracotta', label: 'terracotta', className: 'text-terracotta' },
];

function accentClass(accent: BlockAccent | undefined) {
  return (
    ACCENT_OPTIONS.find((a) => a.value === accent)?.className ||
    'text-coral'
  );
}

function randomId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function About({ about, edit }: { about: Content['about']; edit: EditCtx }) {
  const blocks = about.blocks || [];

  return (
    <section id="about" className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16">
        {blocks.map((block, i) => (
          <AboutBlockView
            key={block.id}
            block={block}
            index={i}
            total={blocks.length}
            edit={edit}
          />
        ))}
      </div>
      {edit.canEdit && (
        <div className="mt-6">
          <button
            type="button"
            className="btn-ghost !px-4 !py-1.5 text-sm"
            onClick={() =>
              edit.updateDraft((d) => {
                d.about.blocks = [
                  ...(d.about.blocks || []),
                  {
                    id: randomId('block'),
                    accent: 'mustard',
                    eyebrow: 'new section',
                    heading: 'New heading',
                    body: 'New body text.',
                  },
                ];
              })
            }
          >
            + add block
          </button>
        </div>
      )}
    </section>
  );
}

function AboutBlockView({
  block,
  index,
  total,
  edit,
}: {
  block: AboutBlock;
  index: number;
  total: number;
  edit: EditCtx;
}) {
  const patch = (p: Partial<AboutBlock>) =>
    edit.updateDraft((d) => {
      const list = d.about.blocks || [];
      const idx = list.findIndex((b) => b.id === block.id);
      if (idx < 0) return;
      list[idx] = { ...list[idx], ...p };
    });

  const patchLink = (p: Partial<NonNullable<AboutBlock['link']>>) =>
    edit.updateDraft((d) => {
      const list = d.about.blocks || [];
      const idx = list.findIndex((b) => b.id === block.id);
      if (idx < 0) return;
      const cur = list[idx].link || { text: '', label: '', url: '' };
      list[idx] = { ...list[idx], link: { ...cur, ...p } };
    });

  const move = (delta: number) =>
    edit.updateDraft((d) => {
      const list = d.about.blocks || [];
      const i = list.findIndex((b) => b.id === block.id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j], list[i]];
    });

  const remove = () =>
    edit.updateDraft((d) => {
      d.about.blocks = (d.about.blocks || []).filter((b) => b.id !== block.id);
    });

  const toggleLink = () =>
    edit.updateDraft((d) => {
      const list = d.about.blocks || [];
      const idx = list.findIndex((b) => b.id === block.id);
      if (idx < 0) return;
      if (list[idx].link) {
        const next = { ...list[idx] };
        delete next.link;
        list[idx] = next;
      } else {
        list[idx] = {
          ...list[idx],
          link: { text: 'More at', label: 'example.com', url: 'https://example.com/' },
        };
      }
    });

  // keep the existing visual rhythm: offset/rotate every other block on desktop
  const offsetClass = index % 2 === 1 ? 'md:mt-20 md:rotate-[0.4deg]' : '';

  return (
    <div className={`card p-8 md:p-10 ${offsetClass}`}>
      {edit.canEdit && (
        <div className="flex items-center flex-wrap gap-2 mb-3 text-xs text-ink/60">
          <select
            value={block.accent}
            onChange={(e) => patch({ accent: e.target.value as BlockAccent })}
            className="rounded-md border border-ink/15 bg-white/80 px-2 py-1 text-xs"
          >
            {ACCENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="px-2 py-0.5 rounded border border-ink/15 hover:bg-white"
            onClick={toggleLink}
            title="toggle footer link"
          >
            {block.link ? 'remove link' : '+ link'}
          </button>
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
            title="remove block"
          >
            ×
          </button>
          <span className="flex-1" />
          <span className="text-ink/30 text-[10px] font-mono">id: {block.id}</span>
        </div>
      )}
      <EditableText
        as="div"
        canEdit={edit.canEdit}
        value={block.eyebrow}
        onChange={(v) => patch({ eyebrow: v })}
        className={`text-xs uppercase tracking-widest mb-3 ${accentClass(block.accent)}`}
      />
      <h2 className="text-3xl md:text-4xl font-display font-semibold">
        <EditableText
          canEdit={edit.canEdit}
          value={block.heading}
          onChange={(v) => patch({ heading: v })}
        />
      </h2>
      <EditableText
        as="div"
        canEdit={edit.canEdit}
        value={block.body}
        onChange={(v) => patch({ body: v })}
        className="mt-5 text-ink/80 leading-relaxed"
        multiline
      />
      {block.link && (
        <p className="mt-6 text-sm text-ink/50">
          <EditableText
            canEdit={edit.canEdit}
            value={block.link.text}
            onChange={(v) => patchLink({ text: v })}
          />{' '}
          <a className="link" href={block.link.url} target="_blank" rel="noreferrer">
            <EditableText
              canEdit={edit.canEdit}
              value={block.link.label}
              onChange={(v) => patchLink({ label: v })}
            />
          </a>
          .
          {edit.canEdit && (
            <span className="block mt-2 text-xs text-ink/40">
              link url:{' '}
              <EditableText
                canEdit={edit.canEdit}
                value={block.link.url}
                onChange={(v) => patchLink({ url: v })}
              />
            </span>
          )}
        </p>
      )}
    </div>
  );
}
