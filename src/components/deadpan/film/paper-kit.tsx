import type { CSSProperties, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import finePaper from '@/assets/textures/fine-paper.webp'
import { cn } from '@/lib/utils'

import { FIGURE } from './film-store'

/** 新闻纸：纸色之上叠一层细纹。各段共用同一种平铺，段与段之间没有接缝。 */
export const NEWSPRINT: CSSProperties = {
  backgroundColor: '#e6cfaa',
  backgroundImage: `url(${finePaper})`,
  backgroundSize: '420px',
  backgroundBlendMode: 'multiply',
}

/** 页边距：与页头一致。 */
export const MARGIN = 'px-[clamp(1.25rem,4vw,4.5rem)]'

/** 报纸的分栏线。double 为报头下的粗细双线。 */
export function Rule({ double, className }: { double?: boolean; className?: string }) {
  return (
    <div aria-hidden className={cn(double ? 'h-[5px] border-t-2 border-b border-ink' : 'h-px bg-ink/55', className)} />
  )
}

/** 朱红印章：方框、缺墨、略歪。 */
export function Seal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex -rotate-6 items-center justify-center border-[3px] border-seal px-[.5em] py-[.18em] font-serif-sc font-black tracking-[.18em] text-seal',
        className,
      )}
      style={{ filter: 'url(#dp-film-ink)' }}
    >
      {children}
    </span>
  )
}

/** 页眉：报名、章节、版次。印在影片段舞台的纸面顶端。 */
export function RunningHead({ chapter, name, page }: { chapter: string; name: string; page: number }) {
  const { t } = useTranslation()
  return (
    <div className={cn('absolute inset-x-0 top-[4.2vh]', MARGIN)}>
      <div className='flex items-baseline justify-between font-mono text-[.66rem] tracking-[.22em] uppercase'>
        <span className='font-serif-sc text-[.95rem] font-black tracking-[.3em]'>{t('dp.paper.masthead')}</span>
        <span>
          <span className='text-seal'>({chapter})</span> {name}
        </span>
        <span>{t('dp.film.page', { n: page })}</span>
      </div>
      <Rule double className='mt-[1.1vh]' />
    </div>
  )
}

/** 图注：贴在插图状态的图版下方，格式仿游戏站。 */
export function PlateCaption({ caption }: { caption: string }) {
  const { t } = useTranslation()
  return (
    <div
      className='absolute flex items-baseline justify-between gap-6 font-serif-sc text-[.8rem] leading-snug'
      style={{
        left: `${FIGURE.x * 100}vw`,
        width: `${FIGURE.scale * 100}vw`,
        top: `calc(${(FIGURE.y + FIGURE.scale) * 100}vh + .7rem)`,
      }}
    >
      <span>{caption}</span>
      <span className='shrink-0 font-mono text-[.6rem] tracking-[.2em] text-ink/70 uppercase'>
        {t('dp.film.credit')}
      </span>
    </div>
  )
}

/** 图版左侧的栏：竖排的章节名与巨大的章节号。 */
export function ChapterColumn({ chapter, name }: { chapter: string; name: string }) {
  return (
    <div
      className='absolute flex items-start gap-[1.2vw]'
      style={{ left: 'clamp(1.25rem,4vw,4.5rem)', top: `${FIGURE.y * 100}vh`, height: `${FIGURE.scale * 100}vh` }}
    >
      <span className='font-heading text-[clamp(3rem,7.5vw,8.5rem)] leading-[.8] font-black tracking-[-.04em] text-seal'>
        {chapter}
      </span>
      <span className='font-serif-sc text-[clamp(1.4rem,2.6vw,3rem)] leading-none font-black tracking-[.2em] [writing-mode:vertical-rl]'>
        {name}
      </span>
    </div>
  )
}

/** 图版右侧的栏：一小段说明。 */
export function NoteColumn({ children }: { children: ReactNode }) {
  return (
    <div
      className='absolute flex flex-col justify-end font-serif-sc text-[.95rem] leading-[1.9]'
      style={{
        right: 'clamp(1.25rem,4vw,4.5rem)',
        width: `calc(${(1 - FIGURE.x - FIGURE.scale) * 100}vw - clamp(1.25rem,4vw,4.5rem) - 2.4vw)`,
        top: `${FIGURE.y * 100}vh`,
        height: `${FIGURE.scale * 100}vh`,
      }}
    >
      {children}
    </div>
  )
}

/** 影片与纸面共用的 SVG 滤镜：印章缺墨、图版墨边不齐。整页只挂一次。 */
export function FilmFilters() {
  return (
    <svg aria-hidden='true' className='pointer-events-none absolute size-0'>
      <defs>
        <filter id='dp-film-ink' x='-10%' y='-10%' width='120%' height='120%'>
          <feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' seed='11' result='grain' />
          <feColorMatrix
            in='grain'
            type='matrix'
            values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 2.1'
            result='mask'
          />
          <feComposite in='SourceGraphic' in2='mask' operator='in' result='worn' />
          <feTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='2' seed='4' result='warp' />
          <feDisplacementMap in='worn' in2='warp' scale='2.4' />
        </filter>
        <filter id='dp-film-edge' x='-2%' y='-2%' width='104%' height='104%'>
          <feTurbulence type='fractalNoise' baseFrequency='0.035 0.06' numOctaves='3' seed='7' result='noise' />
          <feDisplacementMap in='SourceGraphic' in2='noise' scale='7' />
        </filter>
      </defs>
    </svg>
  )
}
