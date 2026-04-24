import { Content, EditCtx } from '../lib/api';
import EditableText from './EditableText';
import ImageUpload from './ImageUpload';

export default function Hero({ content, edit }: { content: Content['hero']; edit: EditCtx }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-coral/20 blur-3xl" />
      <div className="absolute top-40 right-0 w-[22rem] h-[22rem] rounded-full bg-sage/30 blur-3xl" />
      <div className="absolute -bottom-20 left-1/3 w-[24rem] h-[24rem] rounded-full bg-mustard/20 blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-36">
        <EditableText
          as="p"
          canEdit={edit.canEdit}
          value={content.eyebrow}
          onChange={(v) => edit.setField(['hero', 'eyebrow'], v)}
          className="chip !bg-white/70 text-ink/70 tracking-wide uppercase text-xs"
        />
        <h1 className="mt-6 text-6xl md:text-8xl font-display font-semibold leading-[0.95] tracking-tight">
          <EditableText
            as="span"
            canEdit={edit.canEdit}
            value={content.title}
            onChange={(v) => edit.setField(['hero', 'title'], v)}
            className="block"
          />
          <EditableText
            as="span"
            canEdit={edit.canEdit}
            value={content.subtitle}
            onChange={(v) => edit.setField(['hero', 'subtitle'], v)}
            className="block italic text-coral font-display font-[500]"
          />
        </h1>
        <EditableText
          as="p"
          canEdit={edit.canEdit}
          value={content.tagline}
          onChange={(v) => edit.setField(['hero', 'tagline'], v)}
          className="mt-8 max-w-2xl text-xl md:text-2xl text-ink/80 leading-relaxed"
          multiline
        />

        <div className="mt-10 flex flex-wrap gap-3">
          <a href="#signup" className="btn-primary">
            <EditableText
              canEdit={edit.canEdit}
              value={content.signupCta}
              onChange={(v) => edit.setField(['hero', 'signupCta'], v)}
            />
          </a>
          <a href="#about" className="btn-ghost">
            <EditableText
              canEdit={edit.canEdit}
              value={content.aboutCta}
              onChange={(v) => edit.setField(['hero', 'aboutCta'], v)}
            />
          </a>
        </div>

        <div className="mt-16 hidden md:flex items-center gap-6 text-ink/50">
          <div className="h-px w-10 bg-ink/20" />
          <EditableText
            canEdit={edit.canEdit}
            value={content.sublabel}
            onChange={(v) => edit.setField(['hero', 'sublabel'], v)}
            className="text-sm tracking-wide uppercase"
          />
        </div>
      </div>

      <ImageUpload
        canEdit={edit.canEdit}
        url={content.logoUrl || '/logo.svg'}
        alt="Global Underscore Vienna"
        accept="image/svg+xml,image/png,image/webp"
        onChange={(v) => edit.setField(['hero', 'logoUrl'], v)}
        className="absolute right-4 md:right-12 top-8 md:top-24 w-28 md:w-40 opacity-90 animate-float rounded-2xl overflow-hidden"
        imgClassName="w-full h-auto"
      />
    </section>
  );
}
