import { type ReactNode, useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

import { type ReelId, registerSegment, SEGMENTS, subscribeFilm, unregisterSegment } from './film-store'
import { NEWSPRINT } from './paper-kit'

type FilmSectionProps = {
  id: ReelId
  label: string
  /** 印在新闻纸上的内容：图版收成插图时在四周露出。 */
  paper?: ReactNode
  /** 叠在图版上的内容：容器就是图版框，随它缩放。 */
  children?: ReactNode
  className?: string
}

// 新闻纸中间给图版挖一个洞，露出下面那块固定的画布
const HOLE =
  'polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, var(--px) var(--py), calc(var(--px) + var(--pw)) var(--py), calc(var(--px) + var(--pw)) calc(var(--py) + var(--ph)), var(--px) calc(var(--py) + var(--ph)), var(--px) var(--py))'

/**
 * 影片段：一块高于一屏的区域，里面一屏高的舞台吸顶。
 * 舞台把图版框的位置写成 CSS 变量（--px --py --pw --ph --open --t），子元素据此定位与出没。
 */
export function FilmSection({ id, label, paper, children, className }: FilmSectionProps) {
  const section = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const screens = SEGMENTS.find((segment) => segment.id === id)?.screens ?? 2

  useEffect(() => {
    registerSegment(id, section.current)
    return () => unregisterSegment(id)
  }, [id])

  useEffect(
    () =>
      subscribeFilm((state) => {
        const style = stage.current?.style
        if (!style) return
        const reel = state.reels[id]
        style.setProperty('--open', reel.open.toFixed(4))
        style.setProperty('--t', reel.t.toFixed(4))
        style.setProperty('--px', `${reel.x.toFixed(1)}px`)
        style.setProperty('--py', `${reel.y.toFixed(1)}px`)
        style.setProperty('--pw', `${(reel.scale * state.width).toFixed(1)}px`)
        style.setProperty('--ph', `${(reel.scale * state.height).toFixed(1)}px`)
      }),
    [id],
  )

  return (
    <section
      ref={section}
      aria-label={label}
      className={cn('relative', className)}
      style={{ height: `${(screens + 1) * 100}vh` }}
    >
      <div ref={stage} className='sticky top-0 h-screen overflow-hidden'>
        <div className='absolute inset-0 text-ink' style={{ ...NEWSPRINT, clipPath: HOLE }}>
          {paper}
        </div>
        <div
          className='@container absolute top-0 left-0 text-paper'
          style={{
            transform: 'translate3d(var(--px), var(--py), 0)',
            width: 'var(--pw)',
            height: 'var(--ph)',
          }}
        >
          {/* 图版四周不齐的墨边，整屏时淡出 */}
          <div
            aria-hidden
            className='pointer-events-none absolute -inset-[5px] border-[9px] border-ink'
            style={{ filter: 'url(#dp-film-edge)', opacity: 'calc((1 - var(--open)) * 4)' }}
          />
          {children}
        </div>
      </div>
    </section>
  )
}
