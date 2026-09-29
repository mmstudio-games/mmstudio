import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { ScrambleText } from '@/components/motion/scramble-text'
import { SectionLabel } from '@/components/site/section-label'
import { CaseDeadpan } from './case-deadpan'
import { CaseHgt } from './case-hgt'

const CASES = [
  { id: 'deadpan', Case: CaseDeadpan },
  { id: 'hgt', Case: CaseHgt },
]

/** 在办案件：宽屏上两张卡片吸顶叠放，后一张滑上来时前一张缩小变暗。 */
export function HomeCases() {
  const { t } = useTranslation()
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const media = gsap.matchMedia()
      media.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        const wrappers = gsap.utils.toArray<HTMLElement>('[data-case]')
        wrappers.forEach((wrapper, index) => {
          const card = wrapper.querySelector('[data-case-card]')
          gsap.fromTo(
            card,
            { clipPath: 'inset(14% 5% 0% 5%)' },
            {
              clipPath: 'inset(0% 0% 0% 0%)',
              ease: 'none',
              scrollTrigger: { trigger: wrapper, start: 'top bottom', end: 'top 25%', scrub: true },
            },
          )
          const next = wrappers[index + 1]
          if (!next) return
          const stack = { trigger: next, start: 'top bottom', end: 'top 12%', scrub: true }
          gsap.to(card, { scale: 0.9, ease: 'none', scrollTrigger: stack })
          gsap.to(wrapper.querySelector('[data-case-shade]'), { opacity: 0.72, ease: 'none', scrollTrigger: stack })
        })
      })
      return () => media.revert()
    },
    { scope: root },
  )

  return (
    <section ref={root} aria-labelledby='cases-title' className='px-[clamp(1.25rem,4vw,4.5rem)] pt-24 pb-[14svh]'>
      <div className='mb-14 flex flex-col gap-10'>
        <SectionLabel index='02' label={t('cases.label')} />
        <div className='flex items-end justify-between gap-6'>
          <h2 id='cases-title' className='sr-only'>
            {t('cases.label')}
          </h2>
          <p aria-hidden className='flex items-baseline gap-4'>
            <ScrambleText
              text='02'
              duration={1.2}
              className='font-heading text-[clamp(5rem,14vw,13rem)] leading-[.8] font-medium tracking-[-.04em]'
            />
            <span className='font-mono text-[.8rem] tracking-[.2em] text-muted-foreground uppercase'>
              {t('cases.files')}
            </span>
          </p>
          <p className='hidden max-w-[20rem] pb-3 text-right text-[.9rem] leading-[1.7] text-muted-foreground md:block'>
            {t('hero.lede')}
          </p>
        </div>
      </div>
      <div className='flex flex-col gap-8 lg:gap-[14svh]'>
        {CASES.map(({ id, Case }, index) => (
          <div key={id} data-case className='lg:sticky' style={{ top: `calc(4svh + ${index * 1.5}rem)` }}>
            <div
              data-case-card
              className='relative origin-top overflow-hidden lg:h-[88svh] lg:min-h-[620px] lg:[&>article]:h-full'
            >
              <Case />
              <div data-case-shade aria-hidden className='pointer-events-none absolute inset-0 bg-black opacity-0' />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
