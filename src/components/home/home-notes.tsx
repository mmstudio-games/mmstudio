import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { ScrambleText } from '@/components/motion/scramble-text'

import { SectionLabel } from '@/components/site/section-label'

const NOTES = ['one', 'two', 'three'] as const

/** 设计札记：三条大号横排条目，悬停时纸色自下而上填满该行并反色。 */
export function HomeNotes() {
  const { t } = useTranslation()
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const media = gsap.matchMedia()
      media.add('(prefers-reduced-motion: no-preference)', () => {
        for (const row of gsap.utils.toArray<HTMLElement>('[data-note]')) {
          gsap
            .timeline({ scrollTrigger: { trigger: row, start: 'top 88%' } })
            .from(row.querySelector('[data-note-rule]'), { scaleX: 0, duration: 1.2, ease: 'expo.inOut' })
            .from(
              row.querySelectorAll('[data-note-rise]'),
              { yPercent: 60, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: 0.08 },
              0.25,
            )
        }
      })
      return () => media.revert()
    },
    { scope: root },
  )

  return (
    <section
      ref={root}
      aria-labelledby='notes-title'
      className='px-[clamp(1.25rem,4vw,4.5rem)] py-[clamp(6rem,12vw,11rem)]'
    >
      <SectionLabel index='03' label={t('pillars.label')} />
      <h2 id='notes-title' className='sr-only'>
        {t('pillars.label')}
      </h2>
      <ol className='mt-16'>
        {NOTES.map((key, index) => (
          <li key={key} data-note className='group/note relative overflow-hidden'>
            <span data-note-rule aria-hidden className='absolute inset-x-0 top-0 h-px origin-left bg-border' />
            <span
              aria-hidden
              className='absolute inset-0 origin-bottom scale-y-0 bg-foreground transition-transform duration-700 ease-out-expo group-hover/note:scale-y-100'
            />
            <div className='relative grid items-baseline gap-x-10 gap-y-4 py-10 transition-colors duration-500 group-hover/note:text-background lg:grid-cols-[7rem_minmax(0,1fr)_minmax(0,24rem)] lg:py-14'>
              <span data-note-rise className='font-mono text-[.8rem] text-accent'>
                <ScrambleText text={`N°0${index + 1}`} hoverGroup='[data-note]' />
              </span>
              <h3
                data-note-rise
                className='font-heading text-[clamp(2.2rem,5.2vw,5rem)] leading-[1.02] tracking-[-.02em]'
              >
                {/* 悬停位移放在内层，避免与 GSAP 在同一元素上争用 transform */}
                <span className='inline-block transition-transform duration-700 ease-out-expo group-hover/note:translate-x-4'>
                  {t(`pillars.${key}Title`)}
                </span>
              </h3>
              <p
                data-note-rise
                className='max-w-[24rem] text-[.95rem] leading-[1.8] text-muted-foreground transition-colors duration-500 group-hover/note:text-background/70'
              >
                {t(`pillars.${key}Body`)}
              </p>
            </div>
          </li>
        ))}
        <li aria-hidden className='h-px bg-border' />
      </ol>
    </section>
  )
}
