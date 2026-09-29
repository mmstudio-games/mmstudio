import { gsap } from 'gsap'
import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useFinePointer, useReducedMotion } from '@/hooks/use-media-query'
import { onIntroDone } from '@/lib/intro'
import { cn } from '@/lib/utils'

import { DESK_STYLE, InvestigationDesk } from './deadpan-desk'
import { createDustLayer } from './dust-layer'

export const PAPER_STYLE: CSSProperties = {
  backgroundColor: '#e9d5ae',
  backgroundImage: [
    'radial-gradient(ellipse at 18% 22%, rgba(122, 84, 40, .16), transparent 45%)',
    'radial-gradient(ellipse at 82% 78%, rgba(122, 84, 40, .2), transparent 50%)',
    'radial-gradient(ellipse at 50% 50%, rgba(255, 248, 230, .35), transparent 70%)',
    'repeating-linear-gradient(0deg, transparent 0 5px, rgba(55, 40, 24, .025) 5px 6px)',
  ].join(','),
}

const REVEAL_AT = 0.42

/** 首屏「积尘」：一张蒙灰的调查桌，指针是拂尘（光标沿用全站准星）；拂去约四成后余灰散去，桌上物件可以点选。 */
export function DeadpanHero() {
  const { t } = useTranslation()
  const fine = useFinePointer()
  const reduced = useReducedMotion()
  const sheet = useRef<HTMLDivElement>(null)
  const dust = useRef<HTMLCanvasElement>(null)
  const motes = useRef<HTMLCanvasElement>(null)
  const finishRef = useRef<(() => void) | null>(null)
  const [progress, setProgress] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const done = revealed || reduced

  useEffect(() => {
    const area = sheet.current
    const dustCanvas = dust.current
    const moteCanvas = motes.current
    if (reduced || !area || !dustCanvas || !moteCanvas) return

    const layer = createDustLayer(dustCanvas, moteCanvas)
    let finished = false
    let shown = 0
    let last: { x: number; y: number } | null = null
    const timelines: gsap.core.Animation[] = []

    const finish = () => {
      if (finished) return
      finished = true
      layer.burst()
      gsap.to(dustCanvas, { opacity: 0, duration: 1.3, ease: 'power2.inOut' })
      setRevealed(true)
    }
    finishRef.current = finish
    const report = (value: number) => {
      const percent = Math.floor(value * 100)
      if (percent !== shown) {
        shown = percent
        setProgress(value)
      }
      if (value >= REVEAL_AT) finish()
    }
    const wipe = (x0: number, y0: number, x1: number, y1: number) => {
      if (!finished) report(layer.wipe(x0, y0, x1, y1))
    }

    // 只有尺寸真的变了才重铺灰尘（observe 时的首次回调不算）。
    let size = `${area.clientWidth}x${area.clientHeight}`
    const resize = new ResizeObserver(() => {
      const next = `${area.clientWidth}x${area.clientHeight}`
      if (finished || next === size) return
      size = next
      layer.resize()
      report(0)
    })
    resize.observe(area)

    const move = (event: PointerEvent) => {
      const rect = area.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      if (last) wipe(last.x, last.y, x, y)
      last = { x, y }
    }
    const leave = () => {
      last = null
    }
    area.addEventListener('pointermove', move)
    area.addEventListener('pointerleave', leave)

    // 入场后自动拂几笔作提示；触屏上多拂几笔后直接散尽。
    const release = onIntroDone(() => {
      const strokes = fine ? 1 : 4
      const timeline = gsap.timeline({ delay: 0.5, onComplete: fine ? undefined : () => gsap.delayedCall(0.6, finish) })
      for (let i = 0; i < strokes; i++) {
        const state = { p: 0 }
        let previous: { x: number; y: number } | null = null
        const row = strokes === 1 ? 0.42 : 0.22 + i * 0.18
        timeline.to(state, {
          p: 1,
          duration: 1.1,
          ease: 'power2.inOut',
          onUpdate: () => {
            const w = area.clientWidth
            const h = area.clientHeight
            const x = w * (0.06 + 0.62 * state.p)
            const y = h * (row + Math.sin(state.p * Math.PI * 2) * 0.06)
            if (previous) wipe(previous.x, previous.y, x, y)
            previous = { x, y }
          },
        })
      }
      timelines.push(timeline)
    })

    return () => {
      finishRef.current = null
      release()
      for (const timeline of timelines) timeline.kill()
      resize.disconnect()
      area.removeEventListener('pointermove', move)
      area.removeEventListener('pointerleave', leave)
      layer.dispose()
    }
  }, [reduced, fine])

  return (
    <section
      aria-labelledby='dp-hero-title'
      className='relative -mt-[72px] flex min-h-[640px] flex-col bg-[radial-gradient(ellipse_at_50%_40%,#4a3826_0%,#2b2116_45%,#1b140d_85%)] px-[clamp(1rem,3vw,3rem)] pt-[calc(72px+1.25rem)] pb-5 md:h-svh'
    >
      <h1 id='dp-hero-title' className='sr-only'>
        {t('deadpan.name')} · {t('deadpan.english')}
      </h1>
      <div className='relative mx-auto w-full max-w-[1280px] flex-1'>
        <div
          ref={sheet}
          data-desk-frame
          className={cn(
            'relative h-full min-h-[720px] touch-pan-y overflow-hidden border border-[#5a4020]/50 shadow-[0_30px_80px_rgba(0,0,0,.55)] select-none md:min-h-[560px]',
            fine && !done && 'cursor-none',
          )}
          style={DESK_STYLE}
        >
          <InvestigationDesk revealed={done} onReveal={() => finishRef.current?.()} />
          {reduced ? null : (
            <>
              <canvas ref={dust} aria-hidden className='pointer-events-none absolute inset-0 z-50 size-full' />
              <canvas ref={motes} aria-hidden className='pointer-events-none absolute inset-0 z-50 size-full' />
            </>
          )}
        </div>
      </div>

      <div className='mx-auto mt-5 grid w-full max-w-[1280px] grid-cols-[1fr_auto] items-center gap-4 font-mono text-[.64rem] tracking-[.2em] text-[#ecdcbc]/75 uppercase sm:grid-cols-[1fr_auto_1fr]'>
        <span className='hidden sm:inline'>
          <span className='text-accent'>(00)</span> {t('dp.chapters.dust')}
        </span>
        <span className='flex items-center gap-3' aria-live='polite'>
          <span className={cn('size-1.5 bg-accent', !done && 'animate-pulse')} />
          {done ? (
            t('dp.desk.hint')
          ) : (
            <>
              {t('dp.hero.hint')}
              <span aria-hidden className='relative block h-px w-24 bg-[#ecdcbc]/25'>
                <span
                  className='absolute inset-y-0 left-0 bg-accent transition-[width] duration-300'
                  style={{ width: `${Math.min(100, (progress / REVEAL_AT) * 100)}%` }}
                />
              </span>
              <span className='tabular-nums'>
                {t('dp.hero.cleared')} {Math.round(progress * 100)}%
              </span>
            </>
          )}
        </span>
        <span className='flex items-center justify-self-end gap-3'>
          {t('dp.hero.scroll')}
          <span className='relative block h-6 w-px overflow-hidden bg-[#ecdcbc]/25'>
            <span className='absolute inset-x-0 top-0 h-1/2 animate-scroll-cue bg-accent' />
          </span>
        </span>
      </div>
    </section>
  )
}
