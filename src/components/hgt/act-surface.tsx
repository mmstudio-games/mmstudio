import { gsap } from 'gsap'
import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useFinePointer, useReducedMotion } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

import { PaperGrid, splitKeys, useList } from './hgt-kit'
import { actProgress, lens, onActEnter, onHgtFrame, pointer, smooth } from './hgt-store'
import { createLensGlass, type LensGlass } from './lens-glass'
import { type BeneathLayout, drawBeneath, loadBeneathFonts } from './surface-beneath'

/** 五句汤面在纸上的位置：宽屏与竖屏各一套。 */
const FRAGMENT_POS = [
  { x: '8%', y: '21%', mx: '7%', my: '16%' },
  { x: '61%', y: '15%', mx: '40%', my: '27%' },
  { x: '11%', y: '62%', mx: '7%', my: '58%' },
  { x: '57%', y: '56%', mx: '30%', my: '68%' },
  { x: '35%', y: '82%', mx: '10%', my: '81%' },
]

/** 折光镜的半径：随视口缩放。 */
export const lensRadius = (width: number, height: number) => Math.min(170, Math.max(80, Math.min(width, height) * 0.17))

/** 第一幕：水面与水底。纸面上是汤面，指针是一枚折光镜，照出底下的汤底。 */
export function ActSurface({ index }: { index: number }) {
  const { t, i18n } = useTranslation()
  const reduced = useReducedMotion()
  const fine = useFinePointer()
  const root = useRef<HTMLDivElement>(null)
  const glassCanvas = useRef<HTMLCanvasElement>(null)
  const beneath = useRef<HTMLCanvasElement>(null)
  const title = useRef<HTMLDivElement>(null)
  const brake = useRef<HTMLDivElement>(null)
  const hint = useRef<HTMLParagraphElement>(null)
  const glass = useRef<LensGlass | null>(null)
  const [webgl, setWebgl] = useState(true)
  const fragments = useList('hgtPage.surface.fragments')
  const notes = useList('hgtPage.surface.notes')
  const links = useList('hgtPage.surface.links')
  const manifesto = t('hgtPage.surface.manifesto')

  // 画好水面下的汤底：尺寸、语言或字体变化时重画
  // biome-ignore lint/correctness/useExhaustiveDependencies: 文案随语言一起变，语言就是重画的信号
  useEffect(() => {
    const element = root.current
    const target = beneath.current
    if (!element || !target) return
    let cancelled = false
    let timer = 0
    const measure = (): BeneathLayout => {
      const host = element.getBoundingClientRect()
      const box = (rect: DOMRect) => ({
        x: rect.left - host.left,
        y: rect.top - host.top,
        w: rect.width,
        h: rect.height,
      })
      const slot = element.querySelector<HTMLElement>('[data-manifesto-slot]')
      return {
        width: host.width,
        height: host.height,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
        fragments: [...element.querySelectorAll<HTMLElement>('[data-frag]')].map((outer) => {
          const inner = outer.firstElementChild as HTMLElement
          const outerRect = outer.getBoundingClientRect()
          const innerRect = inner.getBoundingClientRect()
          const style = getComputedStyle(inner)
          return {
            box: box(outerRect),
            font: `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
            size: Number.parseFloat(style.fontSize),
            text: inner.textContent ?? '',
            keys: [...inner.querySelectorAll<HTMLElement>('[data-key]')].map((key) => {
              const rect = key.getBoundingClientRect()
              return {
                x: rect.left - innerRect.left + outerRect.left - host.left,
                y: rect.top - innerRect.top + outerRect.top - host.top,
                w: rect.width,
                h: rect.height,
              }
            }),
          }
        }),
        notes,
        links,
        manifesto: { box: slot ? box(slot.getBoundingClientRect()) : { x: 0, y: 0, w: 0, h: 0 }, text: manifesto },
        label: `${t('hgtPage.bottomMark')} · ${t('hgtPage.case')}`,
      }
    }
    const paint = async () => {
      const layout = measure()
      await loadBeneathFonts(layout)
      if (cancelled) return
      drawBeneath(target, measure())
      glass.current?.upload(target)
    }
    const schedule = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(paint, 120)
    }
    void paint()
    const observer = new ResizeObserver(schedule)
    observer.observe(element)
    void document.fonts?.ready.then(schedule)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      observer.disconnect()
    }
  }, [i18n.language, webgl])

  // 折光镜
  useEffect(() => {
    const element = root.current
    const canvas = glassCanvas.current
    if (!element || !canvas) return
    try {
      glass.current = createLensGlass(canvas)
      if (beneath.current && beneath.current.width > 1) glass.current.upload(beneath.current)
    } catch {
      setWebgl(false)
    }
    const state = { x: -1, y: -1, r: 0, press: 0, pressTarget: 0, ripple: 9, tapX: -1, tapY: -1, tapAt: -99, time: 0 }
    const down = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') {
        state.pressTarget = 1
        state.ripple = 0
      }
    }
    const up = (event: PointerEvent) => {
      state.pressTarget = 0
      if (event.pointerType !== 'mouse') {
        const host = element.getBoundingClientRect()
        state.tapX = event.clientX - host.left
        state.tapY = event.clientY - host.top
        state.tapAt = state.time
        state.ripple = 0
      }
    }
    element.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)

    const off = onHgtFrame((frame) => {
      const act = element.closest('[data-act]')
      if (frame.shown !== index && !act?.hasAttribute('data-cut')) return
      const { width, height, dt, time } = frame
      state.time = time
      const p = actProgress(frame.u, index)

      // 片名先占满画面，随滚动让位给汤面
      const leave = smooth(0.08, 0.28, p)
      if (title.current) {
        title.current.style.opacity = String(1 - leave)
        title.current.style.transform = `translate3d(0, ${-leave * 16}vh, 0) scale(${1 - leave * 0.18})`
      }
      element.querySelectorAll<HTMLElement>('[data-frag] > span').forEach((inner, i) => {
        const f = smooth(0.18 + i * 0.03, 0.3 + i * 0.03, p)
        inner.style.opacity = String(f)
        inner.style.transform = `translate3d(0, ${(1 - f) * 16}px, 0)`
        inner.style.filter = f < 0.99 ? `blur(${(1 - f) * 6}px)` : ''
      })
      if (hint.current) hint.current.style.opacity = String(smooth(0.3, 0.38, p))

      // 镜片的目标：精确指针跟手；触屏轻点后移过去，闲着时缓慢游走
      let tx = width / 2 + Math.cos(time * 0.31) * width * 0.28
      let ty = height * 0.5 + Math.sin(time * 0.23 + 0.6) * height * 0.24
      if (pointer.fine && pointer.moved && pointer.x >= 0) {
        tx = pointer.x
        ty = pointer.y
      } else if (time - state.tapAt < 6) {
        tx = state.tapX
        ty = state.tapY
      }
      if (state.x < 0) {
        state.x = tx
        state.y = ty
      }
      const follow = 1 - Math.exp(-dt * (reduced ? 30 : 9))
      state.x += (tx - state.x) * follow
      state.y += (ty - state.y) * follow
      state.press += (state.pressTarget - state.press) * (1 - Math.exp(-dt * 8))
      state.ripple += dt
      const base = lensRadius(width, height) * (1 + state.press * 0.55)
      state.r = state.r ? state.r + (base - state.r) * (1 - Math.exp(-dt * 10)) : base
      // 转场二开头：镜片被强制吸到正中、放大到取景框的尺寸
      if (lens.override) {
        state.x = lens.override.x
        state.y = lens.override.y
        state.r = lens.override.r
      }
      lens.x = state.x
      lens.y = state.y
      lens.r = state.r
      const alpha = lens.hidden ? 0 : smooth(0.22, 0.32, p)

      if (glass.current) {
        glass.current.render(
          state.x,
          state.y,
          state.r,
          reduced ? 0 : time,
          state.press,
          reduced ? 9 : state.ripple,
          alpha,
        )
      } else if (beneath.current) {
        beneath.current.style.opacity = String(alpha)
        beneath.current.style.clipPath = `circle(${state.r}px at ${state.x}px ${state.y}px)`
      }
    })
    return () => {
      off()
      element.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      glass.current?.dispose()
      glass.current = null
    }
  }, [index, reduced])

  // 从转场一剪进来时，片名像镜头急刹一样停稳
  useEffect(
    () =>
      onActEnter((event) => {
        if (event.index !== index || event.via !== 'cut' || reduced || !brake.current) return
        gsap.fromTo(
          brake.current.querySelectorAll('[data-brake]'),
          { scale: 1.32, opacity: 0, filter: 'blur(10px)' },
          {
            scale: 1,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 0.85,
            ease: 'expo.out',
            stagger: 0.08,
            clearProps: 'filter',
          },
        )
      }),
    [index, reduced],
  )

  const zh = i18n.language.startsWith('zh')

  return (
    <div
      ref={root}
      data-cursor={fine ? 'none' : undefined}
      className={cn('absolute inset-0 overflow-hidden bg-[#f2efe6] text-[#0d0b09] select-none', fine && 'cursor-none')}
    >
      <PaperGrid />

      {/* 片名：汤底揭开后，宋体字标顶天立地 */}
      <div ref={title} className='absolute inset-0 flex flex-col items-center justify-center will-change-transform'>
        <div ref={brake} className='flex flex-col items-center gap-[3vh] px-[5vw] text-center'>
          <p data-brake className='font-mono text-[.62rem] tracking-[.32em] text-[#b3261e] uppercase'>
            {t('hgtPage.surface.answerLabel')} · {t('hgtPage.case')}
          </p>
          <h2
            data-brake
            className={cn(
              'font-serif-sc leading-[.92] font-black tracking-[-.02em] whitespace-nowrap',
              'text-[clamp(3rem,13.4vw,15rem)]',
            )}
          >
            {t('hgtPage.surface.name')}
          </h2>
          <p data-brake className='font-mono text-[clamp(.62rem,1vw,.9rem)] tracking-[.6em] text-[#0d0b09]/70'>
            {t('hgtPage.surface.english')}
          </p>
          <p
            data-brake
            className={cn(
              'max-w-[44rem] font-serif-sc leading-[1.7] font-semibold text-balance',
              zh ? 'text-[clamp(1rem,1.7vw,1.5rem)]' : 'text-[clamp(.95rem,1.5vw,1.35rem)]',
            )}
          >
            {t('hgtPage.surface.answer')}
          </p>
        </div>
      </div>

      {/* 汤面：寥寥几句断裂的表象，大片留白 */}
      <div aria-hidden className='absolute inset-0'>
        {fragments.map((fragment, i) => (
          <p
            key={fragment}
            data-frag
            className='absolute top-[var(--my)] left-[var(--mx)] font-serif-sc text-[clamp(1.2rem,2.5vw,2.5rem)] leading-none font-bold whitespace-nowrap md:top-[var(--y)] md:left-[var(--x)]'
            style={
              {
                '--x': FRAGMENT_POS[i].x,
                '--y': FRAGMENT_POS[i].y,
                '--mx': FRAGMENT_POS[i].mx,
                '--my': FRAGMENT_POS[i].my,
              } as CSSProperties
            }
          >
            <span className='inline-block opacity-0'>
              {splitKeys(fragment).map((part, k) =>
                part.key ? (
                  // biome-ignore lint/suspicious/noArrayIndexKey: 拆分结果顺序固定
                  <span key={k} data-key>
                    {part.text}
                  </span>
                ) : (
                  part.text
                ),
              )}
            </span>
          </p>
        ))}
        <span
          data-manifesto-slot
          className='absolute top-[40%] left-[6%] h-[7%] w-[88%] md:top-[37%] md:left-[17%] md:h-[12%] md:w-[66%]'
        />
      </div>

      <canvas
        ref={beneath}
        aria-hidden
        className={cn('pointer-events-none absolute inset-0 size-full', webgl && 'hidden')}
      />
      <canvas
        ref={glassCanvas}
        aria-hidden
        className={cn('pointer-events-none absolute inset-0 size-full', !webgl && 'hidden')}
      />

      <p
        ref={hint}
        className='pointer-events-none absolute bottom-[3vh] left-1/2 flex -translate-x-1/2 items-center gap-4 font-mono text-[.6rem] tracking-[.22em] whitespace-nowrap text-[#0d0b09]/65 uppercase opacity-0'
      >
        <span className='size-2 rounded-full border border-current' />
        {fine ? t('hgtPage.surface.hint') : t('hgtPage.surface.hintTouch')}
        {fine ? <span className='hidden text-[#0d0b09]/45 md:inline'>· {t('hgtPage.surface.press')}</span> : null}
      </p>

      {/* 读屏：汤底的内容 */}
      <div className='sr-only'>
        <p>{t('hgtPage.surface.answer')}</p>
        <ul>
          {fragments.map((fragment, i) => (
            <li key={fragment}>
              {splitKeys(fragment)
                .map((part) => part.text)
                .join('')}
              {notes[i] ? ` — ${notes[i]}` : ''}
            </li>
          ))}
        </ul>
        <p>{manifesto.replace(/[[\]]/g, '')}</p>
      </div>
    </div>
  )
}
