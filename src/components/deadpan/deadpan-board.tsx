import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { type KeyboardEvent, type PointerEvent, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionLabel } from '@/components/site/section-label'
import { cn } from '@/lib/utils'

import { PAPER_STYLE } from './deadpan-hero'

const NOTES = [
  { id: 'suspect', x: 0.08, y: 0.12, tilt: -4 },
  { id: 'investigator', x: 0.74, y: 0.06, tilt: 3 },
  { id: 'contradiction', x: 0.03, y: 0.62, tilt: 2 },
  { id: 'omission', x: 0.46, y: 0.92, tilt: -2 },
  { id: 'crease', x: 0.92, y: 0.6, tilt: 5 },
  { id: 'truth', x: 0.42, y: 0.36, tilt: -1 },
] as const

type NoteId = (typeof NOTES)[number]['id']

const THREADS: [NoteId, NoteId][] = [
  ['suspect', 'truth'],
  ['investigator', 'truth'],
  ['contradiction', 'truth'],
  ['omission', 'truth'],
  ['crease', 'truth'],
  ['suspect', 'contradiction'],
  ['investigator', 'omission'],
  ['omission', 'crease'],
]

/** 推理 · 线索墙：卡片可拖动（也可聚焦后用方向键移动），朱红线实时跟随并带下垂。 */
export function DeadpanBoard() {
  const { t } = useTranslation()
  const root = useRef<HTMLElement>(null)
  const board = useRef<HTMLDivElement>(null)
  const notes = useRef(new Map<NoteId, HTMLDivElement>())
  const paths = useRef(new Map<string, SVGPathElement>())
  const positions = useRef(new Map<NoteId, { x: number; y: number }>(NOTES.map((note) => [note.id, { ...note }])))
  const drag = useRef<{ id: NoteId; dx: number; dy: number; lastX: number } | null>(null)

  /** 按比例坐标摆放卡片，并重画每条线（取卡片顶端图钉处，中点下垂）。 */
  const layout = useCallback(() => {
    const area = board.current
    if (!area) return
    const width = area.clientWidth
    const height = area.clientHeight
    const pins = new Map<NoteId, { x: number; y: number }>()
    for (const [id, element] of notes.current) {
      const position = positions.current.get(id)
      if (!position) continue
      const x = position.x * (width - element.offsetWidth)
      const y = position.y * (height - element.offsetHeight)
      element.style.left = `${x}px`
      element.style.top = `${y}px`
      pins.set(id, { x: x + element.offsetWidth / 2, y: y + 10 })
    }
    for (const [from, to] of THREADS) {
      const a = pins.get(from)
      const b = pins.get(to)
      const path = paths.current.get(`${from}-${to}`)
      if (!a || !b || !path) continue
      const sag = Math.min(70, Math.hypot(b.x - a.x, b.y - a.y) * 0.14)
      path.setAttribute('d', `M${a.x},${a.y} Q${(a.x + b.x) / 2},${(a.y + b.y) / 2 + sag} ${b.x},${b.y}`)
    }
  }, [])

  useEffect(() => {
    const area = board.current
    if (!area) return
    // 初始倾角交给 GSAP，避免与拖动时的 rotation 叠加。
    for (const note of NOTES) {
      const element = notes.current.get(note.id)
      if (element) gsap.set(element, { rotation: note.tilt })
    }
    layout()
    const observer = new ResizeObserver(layout)
    observer.observe(area)
    return () => observer.disconnect()
  }, [layout])

  useGSAP(
    () => {
      const media = gsap.matchMedia()
      media.add('(prefers-reduced-motion: no-preference)', () => {
        const timeline = gsap.timeline({ scrollTrigger: { trigger: board.current, start: 'top 70%' } })
        timeline
          .from('[data-note]', { scale: 0.6, autoAlpha: 0, duration: 0.7, ease: 'back.out(1.6)', stagger: 0.08 })
          .fromTo(
            '[data-thread]',
            { strokeDashoffset: 1 },
            { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut', stagger: 0.07 },
            0.3,
          )
      })
      return () => media.revert()
    },
    { scope: root },
  )

  const toFraction = (id: NoteId, clientX: number, clientY: number) => {
    const area = board.current
    const element = notes.current.get(id)
    const state = drag.current
    if (!area || !element || !state) return
    const rect = area.getBoundingClientRect()
    const x = (clientX - rect.left - state.dx) / (rect.width - element.offsetWidth)
    const y = (clientY - rect.top - state.dy) / (rect.height - element.offsetHeight)
    positions.current.set(id, { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) })
    layout()
  }

  const onPointerDown = (id: NoteId) => (event: PointerEvent<HTMLDivElement>) => {
    const element = event.currentTarget
    const rect = element.getBoundingClientRect()
    element.setPointerCapture(event.pointerId)
    drag.current = { id, dx: event.clientX - rect.left, dy: event.clientY - rect.top, lastX: event.clientX }
    gsap.to(element, { scale: 1.06, duration: 0.3, ease: 'power3.out' })
    element.style.zIndex = '10'
  }
  const onPointerMove = (id: NoteId) => (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current
    if (!state || state.id !== id) return
    const velocity = event.clientX - state.lastX
    state.lastX = event.clientX
    gsap.to(event.currentTarget, { rotation: Math.max(-12, Math.min(12, velocity * 0.8)), duration: 0.3 })
    toFraction(id, event.clientX, event.clientY)
  }
  const onPointerUp = (id: NoteId) => (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id !== id) return
    drag.current = null
    const tilt = NOTES.find((note) => note.id === id)?.tilt ?? 0
    gsap.to(event.currentTarget, { scale: 1, rotation: tilt, duration: 0.9, ease: 'elastic.out(1, 0.4)' })
    event.currentTarget.style.zIndex = ''
  }
  const onKeyDown = (id: NoteId) => (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowLeft: [-0.03, 0], ArrowRight: [0.03, 0], ArrowUp: [0, -0.04], ArrowDown: [0, 0.04] }[event.key]
    const position = positions.current.get(id)
    if (!step || !position) return
    event.preventDefault()
    positions.current.set(id, {
      x: Math.min(1, Math.max(0, position.x + step[0])),
      y: Math.min(1, Math.max(0, position.y + step[1])),
    })
    layout()
  }

  return (
    <section
      ref={root}
      aria-labelledby='dp-board-title'
      className='grid gap-12 px-[clamp(1.25rem,4vw,4.5rem)] py-[clamp(6rem,11vw,10rem)] lg:grid-cols-[minmax(0,24rem)_1fr]'
    >
      <div className='flex flex-col gap-8'>
        <SectionLabel index='03' label={`${t('dp.chapters.deduce')} / ${t('deadpan.meta3')}`} />
        <h2
          id='dp-board-title'
          className='font-serif-sc text-[clamp(2.6rem,5vw,4.6rem)] leading-[1.05] font-black tracking-[.02em]'
        >
          {t('pillars.twoTitle')}
        </h2>
        <p className='text-[1rem] leading-[1.85] text-muted-foreground'>{t('pillars.twoBody')}</p>
        <p className='flex items-center gap-3 font-mono text-[.64rem] tracking-[.18em] text-muted-foreground uppercase'>
          <span className='size-1.5 bg-accent' />
          {t('dp.board.hint')}
        </p>
      </div>

      <div
        ref={board}
        className='relative h-[min(78svh,680px)] min-h-[520px] overflow-hidden border border-border bg-[#231a12] bg-[radial-gradient(circle,rgba(236,220,188,.08)_1px,transparent_1px)] bg-[size:22px_22px]'
      >
        <svg aria-hidden='true' className='pointer-events-none absolute inset-0 size-full'>
          {THREADS.map(([from, to]) => (
            <path
              key={`${from}-${to}`}
              data-thread
              ref={(element) => {
                if (element) paths.current.set(`${from}-${to}`, element)
              }}
              pathLength={1}
              strokeDasharray={1}
              fill='none'
              stroke='#b8321f'
              strokeWidth={1.4}
              className='drop-shadow-[0_2px_2px_rgba(0,0,0,.5)]'
            />
          ))}
        </svg>
        {NOTES.map((note, index) => {
          const truth = note.id === 'truth'
          return (
            // biome-ignore lint/a11y/noStaticElementInteractions: 线索卡用指针拖动，另提供方向键操作
            <div
              key={note.id}
              data-note
              ref={(element) => {
                if (element) notes.current.set(note.id, element)
              }}
              // biome-ignore lint/a11y/noNoninteractiveTabindex: 聚焦后可用方向键移动卡片
              tabIndex={0}
              onPointerDown={onPointerDown(note.id)}
              onPointerMove={onPointerMove(note.id)}
              onPointerUp={onPointerUp(note.id)}
              onPointerCancel={onPointerUp(note.id)}
              onKeyDown={onKeyDown(note.id)}
              data-cursor={t('dp.board.drag')}
              className={cn(
                'absolute w-[clamp(7.25rem,15vw,12.5rem)] cursor-grab touch-none p-3 pt-6 sm:p-4 sm:pt-6 shadow-[8px_14px_30px_rgba(0,0,0,.45)] select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent active:cursor-grabbing',
                truth ? 'bg-[#842219] text-[#f7efdc]' : 'text-[#17120d]',
              )}
              style={truth ? undefined : PAPER_STYLE}
            >
              <span className='absolute top-2 left-1/2 size-2.5 -translate-x-1/2 bg-[#b8321f] shadow-[0_1px_2px_rgba(0,0,0,.6)]' />
              <span className='font-mono text-[.56rem] tracking-[.18em] opacity-60'>
                N°{String(index + 1).padStart(2, '0')}
              </span>
              <p
                className={cn(
                  'mt-2 font-serif-sc leading-[1.2] font-bold',
                  truth ? 'text-[clamp(1.6rem,2.6vw,2.2rem)]' : 'text-[clamp(1.05rem,1.6vw,1.35rem)]',
                )}
              >
                {t(`dp.board.${note.id}`)}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
