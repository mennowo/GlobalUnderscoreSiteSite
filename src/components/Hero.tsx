import { Content } from '../lib/api';
import EditableText from './EditableText';

type EditCtx = { canEdit: boolean; setField: (path: string[], value: string) => void };

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

      {/* (Vienna) — from gusvienna-logo.svg; shield recolored to palette terracotta */}
      <svg
        aria-hidden
        role="img"
        className="absolute right-4 md:right-12 top-8 md:top-24 w-28 md:w-40 opacity-90 animate-float"
        viewBox="60 95 100 80"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>(Vienna)</title>
        <g fill="#C25140">
          <g transform="matrix(1.233234,0,0,1.233234,982.63479,20.770217)">
            <path d="m -722.63269,80.314022 h 12.33148 v 11.481025 h -11.57552 c 0,0 -0.40161,-2.504091 -0.63783,-6.354723 -0.23624,-3.850632 -0.11813,-5.126302 -0.11813,-5.126302 z" />
            <path d="m -721.16801,95.338574 h 10.79592 v 18.591706 c 0,0 -3.36508,-1.15815 -6.16572,-5.69327 -1.36538,-2.21098 -2.79031,-5.94035 -3.73253,-9.071426 -0.73091,-2.428863 -0.89767,-3.82701 -0.89767,-3.82701 z" />
            <path d="m -694.50258,80.314022 h -12.33148 v 11.481025 h 11.57552 c 0,0 0.40161,-2.504091 0.63783,-6.354723 0.23624,-3.850632 0.11813,-5.126302 0.11813,-5.126302 z" />
            <path d="m -695.96726,95.338574 h -10.79592 v 18.591706 c 0,0 3.36508,-1.15815 6.16572,-5.69327 1.36538,-2.21098 2.79031,-5.94035 3.73253,-9.071426 0.73091,-2.428863 0.89767,-3.82701 0.89767,-3.82701 z" />
          </g>
        </g>
        <g fill="#2A221B">
          <path d="m 72.154809,135.73587 c 0,-16.52055 6.0045,-21.77909 9.15126,-24.82753 3.14679,-3.04843 7.17015,-5.74462 8.05517,-4.24498 0.88503,1.49963 -3.13449,3.31885 -5.05202,5.38392 -1.91759,2.06508 -7.80549,7.90382 -8.34634,23.49018 -0.54085,15.58634 7.35067,25.54294 10.52203,28.00134 3.17135,2.45841 3.88122,3.12219 3.28505,3.8044 -0.59618,0.68222 -3.23939,1.10225 -9.54818,-5.86021 -5.9682,-6.58657 -8.06697,-17.01513 -8.06697,-25.74712 z" />
          <path d="m 145.52491,135.73587 c 0,-16.52055 -6.0045,-21.77909 -9.15126,-24.82753 -3.14679,-3.04843 -7.17015,-5.74462 -8.05517,-4.24498 -0.88503,1.49963 3.13449,3.31885 5.05202,5.38392 1.91759,2.06508 7.80549,7.90382 8.34634,23.49018 0.54085,15.58634 -7.35067,25.54294 -10.52203,28.00134 -3.17135,2.45841 -3.88122,3.12219 -3.28505,3.8044 0.59618,0.68222 3.23939,1.10225 9.54818,-5.86021 5.9682,-6.58657 8.06697,-17.01513 8.06697,-25.74712 z" />
        </g>
      </svg>
    </section>
  );
}
