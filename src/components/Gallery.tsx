import { Content } from '../lib/api';
import EditableText from './EditableText';

type EditCtx = { canEdit: boolean; setField: (path: string[], value: string) => void };

const placeholders = [
  { src: 'https://picsum.photos/seed/ci-duet/800/1000', alt: 'Two dancers sharing weight' },
  { src: 'https://picsum.photos/seed/ci-roll/900/700', alt: 'Rolling on a wooden floor' },
  { src: 'https://picsum.photos/seed/ci-lift/700/900', alt: 'A tender lift' },
  { src: 'https://picsum.photos/seed/ci-group/900/700', alt: 'A group dancing together' },
];

export default function Gallery({
  gallery,
  edit,
}: {
  gallery: Content['gallery'];
  edit: EditCtx;
}) {
  return (
    <section className="relative max-w-6xl mx-auto px-6 py-12 md:py-20">
      <div className="flex items-end justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-semibold">
          <EditableText
            canEdit={edit.canEdit}
            value={gallery.heading}
            onChange={(v) => edit.setField(['gallery', 'heading'], v)}
          />
        </h2>
        <span className="text-xs text-ink/50 uppercase tracking-widest hidden md:inline">
          <EditableText
            canEdit={edit.canEdit}
            value={gallery.subtitle}
            onChange={(v) => edit.setField(['gallery', 'subtitle'], v)}
          />
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-4">
        <figure className="col-span-2 md:col-span-4 row-span-2 relative rounded-3xl overflow-hidden shadow-soft group">
          <img
            src="/samdrubling.jpg"
            alt="Samdrubling studio space"
            className="w-full h-full object-cover aspect-[4/3] transition duration-700 group-hover:scale-[1.02]"
          />
          <figcaption className="absolute bottom-3 left-3 chip !bg-white/90 text-xs">
            <EditableText
              canEdit={edit.canEdit}
              value={gallery.venueCaption}
              onChange={(v) => edit.setField(['gallery', 'venueCaption'], v)}
            />
          </figcaption>
        </figure>
        {placeholders.map((p, i) => (
          <figure
            key={i}
            className={`relative rounded-2xl overflow-hidden shadow-soft ${
              i % 2 === 0 ? 'md:rotate-[-0.6deg]' : 'md:rotate-[0.4deg]'
            }`}
          >
            <img
              src={p.src}
              alt={p.alt}
              loading="lazy"
              className="w-full h-full object-cover aspect-[4/5]"
            />
          </figure>
        ))}
      </div>
      <EditableText
        as="p"
        canEdit={edit.canEdit}
        value={gallery.caption}
        onChange={(v) => edit.setField(['gallery', 'caption'], v)}
        className="mt-3 text-xs text-ink/40"
      />
    </section>
  );
}
