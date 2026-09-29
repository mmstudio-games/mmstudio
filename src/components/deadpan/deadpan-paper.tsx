import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ArrowUpRight } from 'lucide-react'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionLabel } from '@/components/site/section-label'
import { GITHUB_URL } from '@/i18n'
import { cn } from '@/lib/utils'
import { usePreferencesStore } from '@/stores/preferences-store'

import { PAPER_STYLE } from './deadpan-hero'

const PARTS = ['part1', 'part2', 'part3', 'part4', 'part5', 'part6'] as const

function Box({ text, align }: { text: string; align: 'left' | 'right' }) {
  const [top, bottom] = text.split(' / ')
  return (
    <div
      className={cn(
        'hidden border-y border-[#17120d] py-1.5 font-mono text-[.58rem] leading-[1.6] tracking-[.16em] uppercase md:block',
        align === 'right' ? 'text-right' : 'text-left',
      )}
    >
      <p className='font-serif-sc text-[.8rem] font-bold tracking-[.2em]'>{top}</p>
      <p className='text-[#842219]'>{bottom}</p>
    </div>
  )
}

/** 见报 · 号外：一张《奇案特刊》头版随滚动落到桌面上，报头逐字落下，最后盖上「已刊」章。 */
export function DeadpanPaper() {
  const { t } = useTranslation()
  const locale = usePreferencesStore((state) => state.locale)
  const zh = locale === 'zh-CN'
  const root = useRef<HTMLElement>(null)
  const today = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date())

  useGSAP(
    () => {
      const media = gsap.matchMedia()
      media.add('(prefers-reduced-motion: no-preference)', () => {
        const paper = root.current?.querySelector('[data-paper]')
        if (!paper) return
        gsap.fromTo(
          paper,
          { rotationX: 48, y: 160, scale: 0.92 },
          {
            rotationX: 0,
            y: 0,
            scale: 1,
            ease: 'none',
            scrollTrigger: { trigger: paper, start: 'top bottom', end: 'top 18%', scrub: true },
          },
        )
        gsap
          .timeline({ scrollTrigger: { trigger: paper, start: 'top 55%' } })
          .from('[data-mast-char]', { yPercent: -120, autoAlpha: 0, duration: 0.8, ease: 'expo.out', stagger: 0.05 })
          .from('[data-rule]', { scaleX: 0, duration: 1, ease: 'expo.inOut', stagger: 0.1 }, 0.1)
          .from('[data-line]', { y: 24, autoAlpha: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06 }, 0.4)
        gsap.fromTo(
          '[data-paper-stamp]',
          { scale: 2.6, rotation: -30, autoAlpha: 0 },
          {
            scale: 1,
            rotation: -9,
            autoAlpha: 0.9,
            duration: 0.5,
            ease: 'back.out(2)',
            scrollTrigger: { trigger: paper, start: 'center 60%' },
          },
        )
      })
      return () => media.revert()
    },
    { scope: root, dependencies: [locale], revertOnUpdate: true },
  )

  return (
    <section
      ref={root}
      aria-labelledby='dp-paper-title'
      className='overflow-hidden px-[clamp(1rem,4vw,4.5rem)] py-[clamp(6rem,11vw,10rem)] [perspective:1600px]'
    >
      <SectionLabel index='04' label={`${t('dp.chapters.publish')} / ${t('dp.paper.masthead')}`} />
      <article
        data-paper
        className='relative mx-auto mt-14 max-w-[1180px] origin-bottom p-[clamp(1.25rem,3.5vw,3.5rem)] text-[#17120d] shadow-[0_40px_90px_rgba(0,0,0,.55)]'
        style={PAPER_STYLE}
      >
        <header className='grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]'>
          <Box text={t('dp.paper.left')} align='left' />
          <p
            aria-hidden
            className={cn(
              'flex justify-center overflow-hidden py-1 whitespace-pre',
              zh
                ? 'font-serif-sc text-[clamp(3.2rem,9vw,8rem)] leading-none font-black tracking-[.18em]'
                : 'font-heading text-[clamp(1.9rem,4.4vw,4.4rem)] leading-none font-bold tracking-[-.01em]',
            )}
          >
            {Array.from(t('dp.paper.masthead')).map((char, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: 报头字符固定
              <span key={index} data-mast-char className='inline-block'>
                {char}
              </span>
            ))}
          </p>
          <Box text={t('dp.paper.right')} align='right' />
        </header>
        <p className='mt-2 text-center font-mono text-[.6rem] tracking-[.3em] uppercase'>{t('dp.hero.motto')}</p>
        <div data-rule className='mt-5 h-[5px] border-y border-[#17120d]' />
        <div className='flex flex-wrap justify-between gap-2 py-2 font-mono text-[.6rem] tracking-[.16em] uppercase'>
          <span>{today}</span>
          <span className='hidden sm:inline'>
            {t('deadpan.name')} · {t('deadpan.english')}
          </span>
          <span>N° 001</span>
        </div>
        <div data-rule className='h-px bg-[#17120d]' />

        <div className='grid gap-10 pt-8 lg:grid-cols-[1fr_15rem]'>
          <div>
            <p
              data-line
              className='w-fit bg-[#842219] px-2 py-1 font-mono text-[.6rem] tracking-[.18em] text-[#f7efdc] uppercase'
            >
              {t('dp.paper.kicker')}
            </p>
            <h2
              id='dp-paper-title'
              data-line
              className='mt-5 font-serif-sc text-[clamp(2.6rem,6.4vw,6rem)] leading-[1.02] font-black tracking-[.02em] text-balance'
            >
              {t('signal.title')}
            </h2>
            <p data-line className='mt-6 max-w-[42rem] font-serif-sc text-[1.15rem] leading-[1.8]'>
              {t('signal.body')}
            </p>
            <div data-rule className='my-8 h-px bg-[#17120d]/40' />
            <div className='gap-10 text-[.92rem] leading-[1.9] text-[#17120d]/85 md:columns-2 md:[column-rule:1px_solid_rgba(23,18,13,.25)]'>
              <p
                data-line
                className={cn(
                  'mb-4',
                  !zh &&
                    'first-letter:float-left first-letter:mr-2 first-letter:font-heading first-letter:text-[3.4rem] first-letter:leading-[.85] first-letter:font-bold',
                )}
              >
                {t('deadpan.description')}
              </p>
              <p data-line className='mb-4'>
                {t('pillars.oneBody')}
              </p>
              <p data-line className='mb-4'>
                {t('pillars.twoBody')}
              </p>
            </div>
            <blockquote data-line className='mt-8 border-y-[3px] border-double border-[#17120d] py-6'>
              <p className='font-serif-sc text-[clamp(1.8rem,3.6vw,3rem)] leading-[1.15] font-black text-[#842219]'>
                {zh ? `「${t('pillars.threeTitle')}」` : `“${t('pillars.threeTitle')}”`}
              </p>
              <p className='mt-3 text-[.92rem] leading-[1.8] text-[#17120d]/80'>{t('pillars.threeBody')}</p>
            </blockquote>
          </div>

          <aside className='flex flex-col gap-6 border-[#17120d]/30 lg:border-l lg:pl-8'>
            <p
              data-line
              className='border-b-2 border-[#17120d] pb-2 font-serif-sc text-[.95rem] font-bold tracking-[.12em]'
            >
              {t('dp.paper.parts')}
            </p>
            <ol className='flex flex-col'>
              {PARTS.map((key, index) => (
                <li
                  key={key}
                  data-line
                  className='flex items-baseline gap-3 border-b border-[#17120d]/20 py-2.5 font-serif-sc text-[1.05rem]'
                >
                  <span className='font-mono text-[.62rem] text-[#842219]'>0{index + 1}</span>
                  {t(`dp.paper.${key}`)}
                </li>
              ))}
            </ol>
            <p data-line className='font-mono text-[.6rem] leading-[1.8] tracking-[.16em] text-[#17120d]/70 uppercase'>
              {t('signal.label')} · {t('signal.date')}
            </p>
            <a
              data-line
              href={GITHUB_URL}
              target='_blank'
              rel='noreferrer'
              className='group flex w-fit items-center gap-2 border-b border-current pb-1 text-[.72rem] font-bold tracking-[.14em] uppercase no-underline hover:text-[#842219]'
            >
              {t('signal.action')}
              <ArrowUpRight className='size-3.5 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
            </a>
          </aside>
        </div>

        <div
          data-paper-stamp
          aria-hidden
          style={{ transform: 'rotate(-9deg)' }}
          className='absolute right-[6%] bottom-[5%] border-[3px] border-[#842219] px-4 py-2 font-serif-sc text-[clamp(1.4rem,3vw,2.6rem)] font-black tracking-[.24em] text-[#842219] opacity-90 mix-blend-multiply'
        >
          {t('dp.paper.stamp')}
        </div>
      </article>
    </section>
  )
}
