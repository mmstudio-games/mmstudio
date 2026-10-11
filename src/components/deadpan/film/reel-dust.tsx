import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useFinePointer } from '@/hooks/use-media-query'
import { onIntroDone } from '@/lib/intro'
import { cn } from '@/lib/utils'

import { DUST_REVEAL_AT, useDeskDust } from '../use-desk-dust'
import { FilmSection } from './film-section'
import { FIGURE, SEGMENTS, seekProgress, segmentRanges, subscribeFilm } from './film-store'
import { MARGIN, PlateCaption, Rule } from './paper-kit'

/** 头版的报头：图版收成插图后露出来。 */
function FrontHead() {
  const { t, i18n } = useTranslation()
  const date = new Date().toLocaleDateString(i18n.language, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const zh = i18n.language.startsWith('zh')
  const tag = 'border-y border-ink px-3 py-1 text-center font-serif-sc text-[.68rem] leading-relaxed tracking-[.2em]'
  const chapters = SEGMENTS.filter((segment, index) => index === 0 || SEGMENTS[index - 1].chapter !== segment.chapter)
  return (
    <>
      <div className={cn('absolute inset-x-0 top-[2.2vh]', MARGIN)}>
        <div className='flex items-baseline justify-between font-mono text-[.6rem] tracking-[.2em] uppercase'>
          <span>{t('dp.hero.office')}</span>
          <span>{date}</span>
          <span>{t('dp.hero.motto')}</span>
        </div>
        <div className='mt-[.5vh] grid grid-cols-[1fr_auto_1fr] items-center gap-[3vw]'>
          <span className={cn(tag, 'justify-self-end')}>{t('dp.paper.left')}</span>
          <h2
            className={cn(
              'leading-none font-black whitespace-nowrap',
              zh
                ? 'font-serif-sc text-[clamp(2.2rem,8.2vh,6.4rem)] tracking-[.24em]'
                : 'font-heading text-[clamp(1.8rem,6.4vh,4.6rem)] tracking-[.02em]',
            )}
          >
            {t('dp.paper.masthead')}
          </h2>
          <span className={cn(tag, 'justify-self-start border-seal text-seal')}>{t('dp.paper.right')}</span>
        </div>
        <Rule double className='mt-[.9vh]' />
      </div>

      {/* 左栏：竖排的名字 */}
      <div
        className='absolute flex items-start gap-[1vw]'
        style={{ left: 'clamp(1.25rem,4vw,4.5rem)', top: `${FIGURE.y * 100}vh`, height: `${FIGURE.scale * 100}vh` }}
      >
        <span className='font-serif-sc text-[clamp(2.4rem,6vw,6.8rem)] leading-[1.02] font-black [writing-mode:vertical-rl]'>
          {t('deadpan.name')}
        </span>
        <span className='font-mono text-[.62rem] tracking-[.3em] uppercase [writing-mode:vertical-rl]'>
          {t('deadpan.label')} — {t('deadpan.status')}
        </span>
      </div>

      {/* 右栏：本期目录，点一行跳到对应段落 */}
      <nav
        aria-label={t('dp.film.contents')}
        className='absolute flex flex-col'
        style={{
          right: 'clamp(1.25rem,4vw,4.5rem)',
          width: `calc(${(1 - FIGURE.x - FIGURE.scale) * 100}vw - clamp(1.25rem,4vw,4.5rem) - 2.4vw)`,
          top: `${FIGURE.y * 100}vh`,
        }}
      >
        <span className='border-b-2 border-ink pb-2 font-mono text-[.62rem] tracking-[.24em] uppercase'>
          {t('dp.film.contents')}
        </span>
        {chapters.map((segment) => (
          <button
            key={segment.id}
            type='button'
            onClick={() => {
              const range = segmentRanges().find((item) => item.id === segment.id)
              if (range) seekProgress(range.from + 0.002)
            }}
            className='group flex items-baseline gap-2 border-b border-ink/30 py-[1.1vh] text-left font-serif-sc text-[clamp(.95rem,1.25vw,1.3rem)] font-bold transition-colors hover:text-seal'
          >
            <span className='font-mono text-[.62rem] font-normal tracking-[.14em] text-seal'>{segment.chapter}</span>
            <span>{t(segment.label)}</span>
            <span aria-hidden className='mb-1 flex-1 border-b border-dotted border-ink/50' />
            <span aria-hidden className='transition-transform group-hover:translate-x-1'>
              →
            </span>
          </button>
        ))}
      </nav>

      <PlateCaption caption={t('dp.film.captionOffice')} />

      {/* 图注之下，头条起头 */}
      <div className={cn('absolute inset-x-0 top-[82.5vh]', MARGIN)}>
        <Rule />
        <p className='mt-[1.6vh] font-mono text-[.62rem] tracking-[.26em] text-seal uppercase'>
          {t('dp.paper.kicker')}
        </p>
        <p className='mt-[.6vh] font-serif-sc text-[clamp(2rem,8.6vh,6.6rem)] leading-[1.05] font-black tracking-[-.01em] whitespace-nowrap'>
          {t('signal.title')}
        </p>
      </div>
    </>
  )
}

/** 00 积尘：首屏。整屏是影片，蒙着灰；拂去之后向下滚动，镜头拉远，画面收成头版上的图版。 */
export function ReelDust() {
  const { t } = useTranslation()
  const fine = useFinePointer()
  const area = useRef<HTMLDivElement>(null)
  const dustRef = useRef<HTMLCanvasElement>(null)
  const motesRef = useRef<HTMLCanvasElement>(null)
  const [dust, setDust] = useState(0)
  const [cleared, setCleared] = useState(false)
  // 灰散尽、淡出之后把两层画布撤掉，不再参与合成
  const [swept, setSwept] = useState(false)
  useEffect(() => {
    if (!cleared) return
    const timer = window.setTimeout(() => setSwept(true), 2600)
    return () => window.clearTimeout(timer)
  }, [cleared])
  const finishDust = useDeskDust({
    area,
    dust: dustRef,
    motes: motesRef,
    enabled: true,
    fine,
    onProgress: setDust,
    onReveal: () => setCleared(true),
  })
  const finish = useRef(finishDust)
  finish.current = finishDust
  // 加载页拉幕之后片名才升起
  const [entered, setEntered] = useState(false)
  useEffect(() => onIntroDone(() => setEntered(true)), [])

  // 灰尘散去前向下滚动，余灰同样散去
  useEffect(
    () =>
      subscribeFilm((state) => {
        if (state.reels.dust.t > 0.012) finish.current()
      }),
    [],
  )

  return (
    <FilmSection id='dust' label={`00 ${t('dp.chapters.dust')}`} paper={<FrontHead />} className='-mt-[72px]'>
      <div ref={area} className='absolute inset-0' style={{ opacity: 'clamp(0, calc((var(--open) - .8) * 6), 1)' }}>
        <canvas
          ref={dustRef}
          aria-hidden
          className={cn('pointer-events-none absolute inset-0 size-full', swept && 'hidden')}
        />
        <canvas
          ref={motesRef}
          aria-hidden
          className={cn('pointer-events-none absolute inset-0 size-full', swept && 'hidden')}
        />

        {/* 开场的片名，镜头一动就淡出 */}
        <div
          className={cn('absolute inset-0 flex flex-col justify-end pb-[11vh]', MARGIN)}
          style={{ opacity: 'clamp(0, calc(1 - (var(--t) - .05) * 9), 1)' }}
        >
          <p className='mb-[2.2vh] font-mono text-[.66rem] tracking-[.3em] uppercase'>
            <span className='text-accent'>(00)</span> {t('dp.chapters.dust')} — {t('dp.hero.office')}
          </p>
          <h1
            className={cn(
              'font-serif-sc text-[clamp(4rem,15.5cqw,18rem)] leading-[.86] font-black tracking-[-.02em] transition-[translate,opacity] duration-[1400ms] ease-out-expo [-webkit-text-stroke:.05em_#120d09] [paint-order:stroke_fill]',
              entered ? 'translate-y-0 opacity-100' : 'translate-y-[18%] opacity-0',
            )}
          >
            {t('deadpan.name')}
          </h1>
          <div className='mt-[3.2vh] flex items-end justify-between gap-8'>
            <p className='font-mono text-[clamp(.8rem,1.5cqw,1.5rem)] tracking-[.62em] uppercase'>
              {t('deadpan.english')}
            </p>
            <p className='flex items-center gap-4 font-mono text-[.66rem] tracking-[.24em] uppercase'>
              {cleared ? (
                <>
                  <span>{t('dp.film.scroll')}</span>
                  <span aria-hidden className='relative block h-9 w-px overflow-hidden bg-paper/30'>
                    <span className='absolute inset-x-0 top-0 h-1/2 animate-scroll-cue bg-accent' />
                  </span>
                </>
              ) : (
                <>
                  <span>{t('dp.hero.hint')}</span>
                  <span className='text-accent tabular-nums'>
                    {Math.round((Math.min(dust, DUST_REVEAL_AT) / DUST_REVEAL_AT) * 100)}%
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* 镜头拉起时的地点字幕 */}
        <p
          className={cn(
            'absolute bottom-[11vh] ml-[clamp(1.25rem,4vw,4.5rem)] w-fit bg-[#120d09] px-4 py-3 font-serif-sc text-[clamp(1.2rem,2.4cqw,2.6rem)] font-bold',
          )}
          style={{
            opacity: 'clamp(0, min(calc((var(--t) - .34) * 12), calc((.66 - var(--t)) * 12)), 1)',
          }}
        >
          {t('dp.hero.office')}
          <span className='mt-2 block font-mono text-[.62rem] font-normal tracking-[.3em] uppercase'>
            {t('dp.hero.edition')}
          </span>
        </p>
      </div>
    </FilmSection>
  )
}
