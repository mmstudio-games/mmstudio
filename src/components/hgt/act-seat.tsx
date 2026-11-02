import { gsap } from 'gsap'
import { type MouseEvent, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Magnetic } from '@/components/motion/magnetic'
import { useReducedMotion } from '@/hooks/use-media-query'
import { HGT_URL } from '@/i18n'

import { useList } from './hgt-kit'
import { actProgress, onActEnter, onHgtFrame, pointer, smooth } from './hgt-store'

type Glyph = {
  hx: number
  hy: number
  x: number
  y: number
  vx: number
  vy: number
  text: string
  size: number
  alpha: number
  phase: number
}

const TABLE = [
  'M150 196 L450 196 L400 128 L200 128 Z',
  'M150 196 L150 206 L450 206 L450 196',
  'M162 206 L162 288',
  'M438 206 L438 288',
  'M212 132 L212 236',
  'M388 132 L388 236',
  // 桌对面那把空椅子
  'M262 126 L262 50 L338 50 L338 126',
  'M262 84 L338 84',
  'M276 50 L276 126',
  'M324 50 L324 126',
]

/** 终幕：底色反转。追光打亮一张空着的审定方桌，下方是被「是」「不是」包围的入口。 */
export function ActSeat({ index }: { index: number }) {
  const { t } = useTranslation()
  const reduced = useReducedMotion()
  const root = useRef<HTMLDivElement>(null)
  const spot = useRef<HTMLDivElement>(null)
  const table = useRef<SVGSVGElement>(null)
  const line = useRef<HTMLParagraphElement>(null)
  const entry = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLAnchorElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const light = useRef<HTMLDivElement>(null)
  const glyphs = useList('hgtPage.seat.glyphs')
  const seal = useList('hgtPage.seat.seal')
  const launching = useRef(false)

  // 追光自上而下打亮，方桌一笔笔画出来
  useEffect(
    () =>
      onActEnter((event) => {
        if (event.index !== index) return
        const paths = table.current?.querySelectorAll('path') ?? []
        if (reduced) {
          gsap.set([spot.current, line.current, entry.current], { clearProps: 'all' })
          gsap.set(paths, { strokeDashoffset: 0 })
          return
        }
        const quick = event.via === 'jump'
        gsap
          .timeline()
          .fromTo(
            spot.current,
            { clipPath: 'circle(0% at 50% 0%)', opacity: 0 },
            { clipPath: 'circle(140% at 50% 0%)', opacity: 1, duration: quick ? 0.6 : 1.4, ease: 'expo.out' },
          )
          .fromTo(
            spot.current,
            { filter: 'brightness(.3)' },
            { filter: 'brightness(1)', duration: 0.24, ease: 'steps(3)' },
            0,
          )
          .fromTo(
            paths,
            { strokeDashoffset: 1 },
            { strokeDashoffset: 0, duration: 0.9, stagger: 0.06, ease: 'power2.inOut' },
            quick ? 0 : 0.35,
          )
          .fromTo(
            line.current,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' },
            quick ? 0.2 : 1,
          )
          .fromTo(
            entry.current,
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' },
            quick ? 0.25 : 1.2,
          )
      }),
    [index, reduced],
  )

  // 白光切开黑幕后才离开；从浏览器后退回来时把幕收起
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (!event.persisted) return
      launching.current = false
      gsap.set(light.current, { clipPath: 'inset(50% 0% 50% 0%)', display: 'none' })
    }
    window.addEventListener('pageshow', reset)
    return () => window.removeEventListener('pageshow', reset)
  }, [])

  // 四散的「是」「不是」：指针靠近入口时被引力牵向中心
  useEffect(() => {
    const element = root.current
    const target = canvas.current
    if (!element || !target) return
    const ctx = target.getContext('2d')
    if (!ctx) return
    let list: Glyph[] = []
    let width = 0
    let height = 0
    let dpr = 1
    let pull = 0
    let touchPull = 0

    const seed = () => {
      width = element.clientWidth
      height = element.clientHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      target.width = Math.round(width * dpr)
      target.height = Math.round(height * dpr)
      const count = Math.round(Math.min(320, Math.max(120, (width * height) / 5200)))
      const box = button.current?.getBoundingClientRect()
      const host = element.getBoundingClientRect()
      const avoid = box
        ? { x: box.left - host.left - 40, y: box.top - host.top - 40, w: box.width + 80, h: box.height + 80 }
        : { x: 0, y: 0, w: 0, h: 0 }
      list = Array.from({ length: count }, (_, i) => {
        let hx = Math.random() * width
        let hy = Math.random() * height
        for (
          let tries = 0;
          tries < 6 && hx > avoid.x && hx < avoid.x + avoid.w && hy > avoid.y && hy < avoid.y + avoid.h;
          tries++
        ) {
          hx = Math.random() * width
          hy = Math.random() * height
        }
        return {
          hx,
          hy,
          x: hx,
          y: hy,
          vx: 0,
          vy: 0,
          text: glyphs[i % Math.max(1, glyphs.length)] ?? '是',
          size: 9 + Math.random() * 7,
          alpha: 0.12 + Math.random() * 0.32,
          phase: Math.random() * Math.PI * 2,
        }
      })
    }
    seed()
    const observer = new ResizeObserver(seed)
    observer.observe(element)
    const press = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') touchPull = 1
    }
    button.current?.addEventListener('pointerdown', press)

    const off = onHgtFrame((frame) => {
      const act = element.closest('[data-act]')
      if (frame.shown !== index && !act?.hasAttribute('data-cut')) return
      const { dt, time } = frame
      const p = actProgress(frame.u, index)
      if (table.current) table.current.style.transform = `scale(${1 + smooth(0.1, 1, p) * 0.05})`

      const box = button.current?.getBoundingClientRect()
      const host = element.getBoundingClientRect()
      if (!box) return
      const cx = box.left - host.left + box.width / 2
      const cy = box.top - host.top + box.height / 2
      const hw = box.width / 2
      const hh = box.height / 2
      // 指针离按钮边缘越近，引力越强（按钮很大，按中心算会把整片字都吸走）
      const edge =
        pointer.x >= 0
          ? Math.hypot(Math.max(0, Math.abs(pointer.x - cx) - hw), Math.max(0, Math.abs(pointer.y - cy) - hh))
          : 1e4
      touchPull = Math.max(0, touchPull - dt * 0.6)
      const near = pointer.fine ? 1 - smooth(0, Math.min(260, host.width * 0.18), edge) : 0
      const goal = launching.current ? 1 : Math.max(near, touchPull)
      pull += (goal - pull) * (1 - Math.exp(-dt * 4))
      element.style.setProperty('--pull', pull.toFixed(3))

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const glyph of list) {
        if (!reduced) {
          const dx = cx - glyph.x
          const dy = cy - glyph.y
          const force = (5 + 26 * pull) * pull
          glyph.vx += (dx * force + (glyph.hx - glyph.x) * 2.2 * (1 - pull)) * dt
          glyph.vy += (dy * force + (glyph.hy - glyph.y) * 2.2 * (1 - pull)) * dt
          glyph.vx += Math.cos(time * 0.4 + glyph.phase) * 6 * dt
          glyph.vy += Math.sin(time * 0.33 + glyph.phase) * 6 * dt
          const damp = Math.exp(-dt * (3.2 + pull * 2))
          glyph.vx *= damp
          glyph.vy *= damp
          glyph.x += glyph.vx * dt
          glyph.y += glyph.vy * dt
        }
        const centre = Math.hypot((glyph.x - cx) / hw, (glyph.y - cy) / hh)
        const swallowed = 1 - smooth(0.25, 1.05, centre)
        const alpha = glyph.alpha * (1 - swallowed) * (1 + pull * 0.8)
        if (alpha < 0.01) continue
        ctx.globalAlpha = Math.min(1, alpha)
        ctx.fillStyle = glyph.text === glyphs[0] ? '#f2efe6' : '#c9c3b4'
        ctx.font = `600 ${glyph.size}px "Noto Serif SC Variable", "JetBrains Mono Variable", serif`
        ctx.fillText(glyph.text, glyph.x, glyph.y)
      }
      ctx.globalAlpha = 1
    })
    return () => {
      off()
      observer.disconnect()
      button.current?.removeEventListener('pointerdown', press)
    }
  }, [glyphs, index, reduced])

  const enter = (event: MouseEvent<HTMLAnchorElement>) => {
    if (reduced || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    if (launching.current) return
    launching.current = true
    const box = button.current?.getBoundingClientRect()
    const host = root.current?.getBoundingClientRect()
    const y = box && host ? ((box.top + box.height / 2 - host.top) / host.height) * 100 : 50
    gsap
      .timeline({ onComplete: () => window.location.assign(HGT_URL) })
      .set(light.current, { display: 'block', clipPath: `inset(${y}% 0% ${100 - y}% 0%)` })
      .to(
        light.current,
        { clipPath: `inset(${y - 0.4}% 0% ${100 - y - 0.4}% 0%)`, duration: 0.18, ease: 'power2.out' },
        0.15,
      )
      .to(light.current, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5, ease: 'expo.in' }, 0.38)
  }

  return (
    <div ref={root} className='absolute inset-0 overflow-hidden bg-[#0d0b09] text-[#f2efe6] select-none [--pull:0]'>
      {/* 追光 */}
      <div
        ref={spot}
        aria-hidden
        className='pointer-events-none absolute inset-0'
        style={{
          background:
            'radial-gradient(ellipse 34% 62% at 50% -4%, rgba(242,239,230,.2), rgba(242,239,230,.07) 52%, transparent 74%), radial-gradient(ellipse 30% 9% at 50% 61%, rgba(242,239,230,.1), transparent 70%)',
        }}
      >
        <span className='absolute top-0 left-1/2 h-[64%] w-[34vw] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(242,239,230,.09),rgba(242,239,230,0))] [clip-path:polygon(38%_0,62%_0,100%_100%,0_100%)]' />
      </div>

      <canvas ref={canvas} aria-hidden className='pointer-events-none absolute inset-0 size-full' />

      {/* 空着的审定方桌 */}
      <div className='absolute top-[13vh] left-1/2 flex w-[min(40rem,82vw)] -translate-x-1/2 flex-col items-center'>
        <p
          ref={line}
          className='relative z-10 -mb-[3vh] font-serif-sc text-[clamp(1.05rem,2vw,1.9rem)] font-semibold tracking-[.12em] text-[#f2efe6]/90'
        >
          {t('hgtPage.seat.line')}
        </p>
        <svg
          ref={table}
          aria-hidden='true'
          viewBox='0 0 600 300'
          className='h-auto w-full origin-center fill-none stroke-[#f2efe6]/80'
        >
          {TABLE.map((d) => (
            <path key={d} d={d} pathLength={1} strokeWidth={1} className='[stroke-dasharray:1]' />
          ))}
        </svg>
      </div>

      {/* 引力入口 */}
      <div ref={entry} className='absolute inset-x-0 bottom-[11vh] flex flex-col items-center gap-[2.4vh] px-6'>
        <Magnetic strength={0.22}>
          <span className='relative block'>
            <a
              ref={button}
              href={HGT_URL}
              onClick={enter}
              data-cursor={t('hgtPage.seat.enter')}
              className='group grid place-items-center border border-[#f2efe6]/80 bg-[#0d0b09] px-[clamp(2.2rem,7vw,7rem)] py-[clamp(1.1rem,3.2vh,2.2rem)] font-serif-sc text-[clamp(1.9rem,5.2vw,5.4rem)] leading-none font-black tracking-[.08em] text-[#f2efe6] no-underline shadow-[0_0_calc(var(--pull)*90px)_calc(var(--pull)*8px)_rgba(242,239,230,.18)] transition-colors duration-500 ease-out-expo hover:bg-[#f2efe6] hover:text-[#0d0b09] focus-visible:bg-[#f2efe6] focus-visible:text-[#0d0b09]'
            >
              {t('hgtPage.seat.enter')}
            </a>
            <span
              aria-hidden
              className='pointer-events-none absolute -top-[1.4rem] -right-[1.6rem] grid size-[clamp(3.6rem,6vw,5.2rem)] rotate-[-8deg] place-items-center bg-[#b3261e] text-center font-serif-sc text-[clamp(.66rem,1vw,.9rem)] leading-[1.25] font-black tracking-[.1em] text-[#f2efe6] shadow-[0_0_0_3px_#0d0b09] [filter:url(#hgt-ink-edge)]'
            >
              <span>
                {seal[0]}
                <br />
                {seal[1]}
              </span>
            </span>
          </span>
        </Magnetic>
        <p className='font-mono text-[.58rem] tracking-[.3em] text-[#f2efe6]/45 uppercase'>
          {t('hgtPage.seat.sealText')} · {t('hgtPage.seat.site')}
        </p>
      </div>

      <div ref={light} aria-hidden className='pointer-events-none absolute inset-0 z-50 hidden bg-[#fbfaf6]' />
    </div>
  )
}
