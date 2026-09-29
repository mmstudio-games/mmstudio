import { gsap } from 'gsap'
import { ArrowUpRight } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Magnetic } from '@/components/motion/magnetic'
import { SectionLabel } from '@/components/site/section-label'
import { useFinePointer, useReducedMotion } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

import { type ArchivedCase, CASE_ARCHIVE, CASE_LEVELS, CASE_TYPES, CATALOG_URL, type CaseType } from './case-archive'
import { PAPER_STYLE } from './deadpan-hero'

function LevelMarks({ level }: { level: ArchivedCase['level'] }) {
  const rank = CASE_LEVELS.indexOf(level)
  return (
    <span aria-hidden className='flex gap-[3px]'>
      {CASE_LEVELS.map((key, index) => (
        <span key={key} className={cn('size-[6px]', index <= rank ? 'bg-current' : 'bg-current/20')} />
      ))}
    </span>
  )
}

/** 跟随指针的卷宗小卡，随水平速度倾斜。 */
function PreviewCard({ item, index }: { item: ArchivedCase | null; index: number }) {
  const { t } = useTranslation()
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = root.current
    if (!element) return
    const xTo = gsap.quickTo(element, 'x', { duration: 0.5, ease: 'power3' })
    const yTo = gsap.quickTo(element, 'y', { duration: 0.5, ease: 'power3' })
    const rotate = gsap.quickTo(element, 'rotation', { duration: 0.6, ease: 'power3' })
    let lastX = 0
    const move = (event: PointerEvent) => {
      xTo(event.clientX + 28)
      yTo(event.clientY - 120)
      rotate(Math.max(-14, Math.min(14, (event.clientX - lastX) * 0.6)))
      lastX = event.clientX
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [])

  return (
    <div ref={root} aria-hidden className='pointer-events-none fixed top-0 left-0 z-[60]'>
      <div
        className={cn(
          'relative flex h-60 w-44 flex-col border border-[#7c6545] p-4 text-[#17120d] shadow-[14px_20px_40px_rgba(0,0,0,.45)] transition-[scale,opacity] duration-300 ease-out-expo',
          item ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
        )}
        style={PAPER_STYLE}
      >
        {item ? (
          <>
            <div className='flex justify-between border-b-2 border-current pb-2 font-mono text-[.5rem] font-bold tracking-[.12em]'>
              <span>CASE FILE</span>
              <span>N°{String(index + 1).padStart(3, '0')}</span>
            </div>
            <p
              className={cn(
                'mt-4 flex-1 font-serif-sc font-bold',
                item.edition === 'zh'
                  ? 'text-[1.5rem] leading-[1.05] tracking-[.08em] [writing-mode:vertical-rl]'
                  : 'font-heading text-[1.5rem] leading-[1.05]',
              )}
            >
              {item.name}
            </p>
            <div className='flex items-end justify-between'>
              <span className='rotate-[-6deg] border-2 border-[#842219] px-1.5 py-0.5 font-serif-sc text-[.7rem] font-bold text-[#842219]'>
                {t(`dp.types.${item.type}`)}
              </span>
              <span className='text-[#17120d]/70'>
                <LevelMarks level={item.level} />
              </span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

/** 开卷 · 案卷总目：游戏站编辑部卷宗，可按案型筛选。 */
export function DeadpanCatalog() {
  const { t } = useTranslation()
  const fine = useFinePointer()
  const reduced = useReducedMotion()
  const [filter, setFilter] = useState<CaseType | 'all'>('all')
  const [hovered, setHovered] = useState<number | null>(null)
  const visible = useMemo(() => CASE_ARCHIVE.map((item) => filter === 'all' || item.type === filter), [filter])
  const types = CASE_TYPES.filter((type) => CASE_ARCHIVE.some((item) => item.type === type))
  const counter = { value: 0 }

  return (
    <section aria-labelledby='dp-catalog-title' className='px-[clamp(1.25rem,4vw,4.5rem)] py-[clamp(6rem,11vw,10rem)]'>
      <SectionLabel index='01' label={`${t('dp.chapters.open')} / ${t('dp.catalog.title')}`} />
      <div className='mt-12 grid gap-8 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-end'>
        <h2
          id='dp-catalog-title'
          className='font-serif-sc text-[clamp(3.4rem,9vw,8.5rem)] leading-[.9] font-black tracking-[.04em]'
        >
          {t('dp.catalog.title')}
        </h2>
        <p className='text-[.95rem] leading-[1.8] text-muted-foreground'>{t('dp.catalog.note')}</p>
      </div>

      <fieldset className='mt-12 flex flex-wrap gap-2'>
        <legend className='sr-only'>{t('dp.catalog.filter')}</legend>
        {(['all', ...types] as const).map((type) => (
          <button
            key={type}
            type='button'
            aria-pressed={filter === type}
            onClick={() => setFilter(type)}
            className='border border-border px-3.5 py-1.5 text-[.8rem] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-foreground'
          >
            {type === 'all' ? t('dp.catalog.all') : t(`dp.types.${type}`)}
            <span className='ml-2 font-mono text-[.66rem] opacity-60'>
              {type === 'all' ? CASE_ARCHIVE.length : CASE_ARCHIVE.filter((item) => item.type === type).length}
            </span>
          </button>
        ))}
      </fieldset>

      <ul className='mt-10 border-t border-border' onPointerLeave={() => setHovered(null)}>
        {CASE_ARCHIVE.map((item, index) => {
          const shown = visible[index]
          const number = shown ? ++counter.value : 0
          return (
            <li
              key={item.name}
              aria-hidden={!shown}
              className={cn(
                'grid transition-[grid-template-rows,opacity] duration-500 ease-out-expo',
                shown ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
              )}
            >
              <div className='overflow-hidden'>
                <a
                  href={CATALOG_URL}
                  target='_blank'
                  rel='noreferrer'
                  tabIndex={shown ? undefined : -1}
                  onPointerEnter={() => setHovered(index)}
                  onFocus={() => setHovered(null)}
                  className='group/row relative grid grid-cols-[2.5rem_1fr_auto] items-center gap-x-4 gap-y-1 border-b border-border py-5 no-underline md:grid-cols-[3.5rem_1fr_9rem_6rem_12rem_1.5rem] md:py-6'
                >
                  <span
                    aria-hidden
                    className='absolute inset-0 origin-left scale-x-0 bg-[#ecdcbc]/[.05] transition-transform duration-500 ease-out-expo group-hover/row:scale-x-100'
                  />
                  <span className='relative font-mono text-[.72rem] text-accent tabular-nums'>
                    {String(number).padStart(2, '0')}
                  </span>
                  <span
                    className={cn(
                      'relative transition-transform duration-500 ease-out-expo group-hover/row:translate-x-3',
                      item.edition === 'zh'
                        ? 'font-serif-sc text-[clamp(1.4rem,3vw,2.6rem)] font-semibold tracking-[.02em]'
                        : 'font-heading text-[clamp(1.4rem,3vw,2.6rem)]',
                    )}
                  >
                    {item.name}
                  </span>
                  <ArrowUpRight
                    aria-hidden
                    className='relative size-5 justify-self-end text-muted-foreground transition-[translate,color] duration-500 group-hover/row:-translate-y-1 group-hover/row:translate-x-1 group-hover/row:text-accent md:order-last'
                  />
                  <span className='relative col-start-2 text-[.8rem] text-muted-foreground md:col-start-auto'>
                    {t(`dp.types.${item.type}`)}
                  </span>
                  <span className='relative hidden items-center gap-2 text-[.72rem] text-muted-foreground md:flex'>
                    <LevelMarks level={item.level} />
                    {t(`dp.levels.${item.level}`)}
                  </span>
                  <span className='relative hidden font-mono text-[.62rem] tracking-[.14em] text-muted-foreground uppercase md:block'>
                    {item.edition === 'zh' ? t('dp.catalog.editionZh') : t('dp.catalog.editionEn')}
                  </span>
                  <span className='sr-only'>{t('a11y.external')}</span>
                </a>
              </div>
            </li>
          )
        })}
      </ul>

      <Magnetic className='mt-12'>
        <a
          href={CATALOG_URL}
          target='_blank'
          rel='noreferrer'
          className='group flex w-fit items-center gap-3 border-b border-current pb-2 text-[.75rem] font-bold tracking-[.16em] uppercase no-underline transition-colors hover:text-accent'
        >
          {t('dp.catalog.browse')}
          <ArrowUpRight className='size-4 transition-transform duration-500 ease-out-expo group-hover:translate-x-1 group-hover:-translate-y-1' />
        </a>
      </Magnetic>

      {fine && !reduced ? (
        <PreviewCard item={hovered === null ? null : CASE_ARCHIVE[hovered]} index={hovered ?? 0} />
      ) : null}
    </section>
  )
}
