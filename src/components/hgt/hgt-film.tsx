import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useReducedMotion } from '@/hooks/use-media-query'
import { isIntroDone } from '@/lib/intro'
import { getLenis } from '@/lib/smooth-scroll'

import { ActGate } from './act-gate'
import { ActPools } from './act-pools'
import { ActSeat } from './act-seat'
import { ActSurface } from './act-surface'
import { ActVerdict } from './act-verdict'
import {
  type CutEnv,
  cutGateToSurface,
  cutPoolsToSeat,
  cutSurfaceToVerdict,
  cutVerdictToPools,
  hardCut,
} from './hgt-cuts'
import { PaperGrid, useList } from './hgt-kit'
import { ACT_STARTS, ACTS, actAt, emitHgtFrame, lens, pointer, TOTAL_SCREENS } from './hgt-store'
import { TimecodeRail } from './timecode-rail'

const CUTS = [cutGateToSurface, cutSurfaceToVerdict, cutVerdictToPools, cutPoolsToSeat]

/**
 * 海龟汤调查局产品页：没有楼层，全页共用一块吸顶的画面。
 * 幕内滚动驱动推演；滚过幕的交界时，导演锁住滚动、播一段剪辑转场，再把画面停在下一幕的开头。
 */
export default function HgtFilm() {
  const { t } = useTranslation()
  const reduced = useReducedMotion()
  const container = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(0)
  const shownRef = useRef(0)
  const cut = useRef<GSAPTimeline | null>(null)
  const solved = useRef(false)
  /** 转场一播完之后为真：页头从此可以出现。 */
  const solvedAt = useRef(false)
  const lock = useRef(false)
  const reducedRef = useRef(reduced)
  reducedRef.current = reduced
  const yesRef = useRef('')
  yesRef.current = t('hgtPage.verdicts.yes')
  const acts = useList('hgtPage.acts')

  const show = useCallback((index: number) => {
    shownRef.current = index
    setShown(index)
  }, [])

  const env = useCallback((): CutEnv => {
    const element = stage.current as HTMLDivElement
    return { stage: element, width: element.clientWidth, height: element.clientHeight, show, yesWord: yesRef.current }
  }, [show])

  const currentU = useCallback(() => {
    const element = container.current
    const view = stage.current
    if (!element || !view) return 0
    return Math.max(0, -element.getBoundingClientRect().top / view.clientHeight)
  }, [])

  const jumpTo = useCallback((u: number) => {
    const element = container.current
    const view = stage.current
    if (!element || !view) return
    const y = element.getBoundingClientRect().top + window.scrollY + u * view.clientHeight
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true })
    else window.scrollTo({ top: y, behavior: 'instant' })
  }, [])

  const release = useCallback(() => {
    lock.current = false
    const lenis = getLenis()
    if (lenis && isIntroDone()) lenis.start()
  }, [])

  // 第 0 幕藏起页头（直到转场一播完）；终幕底色反转，页头跟着变暗
  const syncChrome = useCallback(() => {
    const html = document.documentElement
    if (shownRef.current === 0 || (cut.current && !solvedAt.current)) html.dataset.hgtChrome = 'hidden'
    else delete html.dataset.hgtChrome
    if (shownRef.current === ACTS.length - 1) html.dataset.hgtTone = 'dark'
    else delete html.dataset.hgtTone
  }, [])

  const play = useCallback(
    (from: number, to: number) => {
      lock.current = true
      getLenis()?.stop()
      const finish = () => {
        cut.current = null
        // 停在下一幕的开头；若滚动已经略过开头一点，就停在原处，不往回拽（往回拽会把页头带出来）
        const target = ACT_STARTS[to] + 0.004
        const now = currentU()
        if (!(now >= target && now < target + 0.25)) jumpTo(target)
        if (from === 0) solvedAt.current = true
        syncChrome()
        release()
        // 键盘焦点若还留在上一幕（已不可操作），或随着被禁用的词片掉回了 body，交给新的一幕
        const active = document.activeElement
        const next = stage.current?.querySelector<HTMLElement>(`[data-act='${ACTS[to].id}']`)
        const stranded =
          !active || active === document.body || (stage.current?.contains(active) && !next?.contains(active))
        if (next && stranded) next.focus({ preventScroll: true })
      }
      try {
        const timeline = CUTS[from](env())
        cut.current = timeline
        timeline.eventCallback('onComplete', finish)
      } catch {
        hardCut(env(), to, false)
        finish()
      }
    },
    [currentU, env, jumpTo, release, syncChrome],
  )

  const openGate = useCallback(() => {
    if (solved.current || cut.current) return
    solved.current = true
    if (reducedRef.current) {
      solvedAt.current = true
      hardCut(env(), 1, false)
      jumpTo(ACT_STARTS[1] + 0.004)
    } else play(0, 1)
  }, [env, jumpTo, play])

  // 每帧：读滚动位置、执行幕间剪辑、广播进度
  useEffect(() => {
    let frame = 0
    let last = performance.now()
    const start = last
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop)
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const element = container.current
      const view = stage.current
      if (!element || !view) return
      const width = view.clientWidth
      const height = view.clientHeight
      const u = Math.max(0, -element.getBoundingClientRect().top / height)
      pointer.vx *= Math.exp(-dt * 6)

      const lenis = getLenis()
      const gateLocked = !solved.current && !reducedRef.current && shownRef.current === 0
      if ((lock.current || gateLocked) && lenis && !lenis.isStopped) lenis.stop()

      if (!cut.current) {
        const target = actAt(u)
        const current = shownRef.current
        if (target !== current) {
          if (gateLocked) jumpTo(0)
          else if (target === current + 1 && !reducedRef.current) play(current, target)
          else hardCut(env(), target, !reducedRef.current)
        }
      }
      emitHgtFrame({ time: (now - start) / 1000, dt, u, shown: shownRef.current, width, height })
    }
    frame = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frame)
      cut.current?.kill()
      cut.current = null
      lens.hidden = false
      lens.override = null
      if (lock.current || !solved.current) {
        lock.current = false
        const lenis = getLenis()
        if (lenis && isIntroDone()) lenis.start()
      }
    }
  }, [env, jumpTo, play])

  // 指针：舞台吸顶在视口左上角，视口坐标就是舞台坐标
  useEffect(() => {
    let lastTime = 0
    const move = (event: PointerEvent) => {
      const now = performance.now()
      if (pointer.x >= 0 && lastTime) {
        const velocity = (event.clientX - pointer.x) / Math.max(0.008, (now - lastTime) / 1000)
        pointer.vx += (velocity - pointer.vx) * 0.3
      }
      lastTime = now
      pointer.x = event.clientX
      pointer.y = event.clientY
      pointer.fine = event.pointerType === 'mouse'
      if (pointer.fine) pointer.moved = true
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => {
      window.removeEventListener('pointermove', move)
      pointer.x = -1
      pointer.y = -1
      pointer.moved = false
    }
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: shown 是同步页头的信号
  useEffect(syncChrome, [shown, syncChrome])
  useEffect(
    () => () => {
      delete document.documentElement.dataset.hgtChrome
      delete document.documentElement.dataset.hgtTone
    },
    [],
  )

  const components = [
    <ActGate key='gate' index={0} onSolved={openGate} onSkip={openGate} />,
    <ActSurface key='surface' index={1} />,
    <ActVerdict key='verdict' index={2} />,
    <ActPools key='pools' index={3} />,
    <ActSeat key='seat' index={4} />,
  ]

  return (
    <div
      ref={container}
      className='relative -mt-[72px] bg-[#0d0b09]'
      style={{ height: `calc(${TOTAL_SCREENS + 1} * 100svh)` }}
    >
      <h1 className='sr-only'>{t('hgtPage.srTitle')}</h1>
      <div ref={stage} className='sticky top-0 h-svh w-full overflow-hidden bg-[#0d0b09]'>
        <svg aria-hidden='true' className='pointer-events-none absolute size-0'>
          <filter id='hgt-whip' x='-15%' y='0' width='130%' height='100%' colorInterpolationFilters='sRGB'>
            <feGaussianBlur data-fx='whip-blur' stdDeviation='0 0' />
          </filter>
          <filter id='hgt-ink-edge' x='-5%' y='-20%' width='110%' height='140%'>
            <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves={2} seed={3} />
            <feDisplacementMap in='SourceGraphic' scale={3} />
          </filter>
        </svg>

        {/* 不在画面上的幕用 visibility 加 opacity 双重隐藏：子元素即使自己写了 visible 也露不出来 */}
        {ACTS.map((item, index) => (
          <section
            key={item.id}
            data-act={item.id}
            data-shown={shown === index ? '' : undefined}
            inert={shown !== index}
            tabIndex={-1}
            aria-label={acts[index]}
            className='invisible absolute inset-0 opacity-0 outline-none data-cut:visible data-cut:opacity-100 data-shown:visible data-shown:opacity-100'
          >
            <div data-act-cam className='absolute inset-0'>
              {components[index]}
            </div>
          </section>
        ))}

        {/* 转场用的叠层：平时都藏着 */}
        <div data-fx='paper' aria-hidden className='pointer-events-none absolute inset-0 z-20 hidden bg-[#f2efe6]'>
          <PaperGrid />
        </div>
        <canvas data-fx='glyph' aria-hidden className='pointer-events-none absolute inset-0 z-20 hidden size-full' />
        <div
          data-fx='frame'
          aria-hidden
          className='pointer-events-none absolute z-30 hidden border-2 border-[#0d0b09] shadow-[0_0_0_1px_rgba(242,239,230,.6)]'
        />
        <div data-fx='bars' aria-hidden className='pointer-events-none absolute inset-y-0 left-0 z-30 hidden w-[32vw]'>
          <span className='h-full w-[14vw] bg-black' />
          <span className='h-full w-[4vw] bg-[#2a2723]' />
          <span className='h-full w-[14vw] bg-black' />
        </div>
        <div data-fx='ghosts' aria-hidden className='pointer-events-none absolute inset-0 z-30 hidden' />
        <TimecodeRail />
        <span
          data-fx='blade'
          aria-hidden
          className='pointer-events-none absolute inset-y-0 left-1/2 z-50 hidden w-[3px] -translate-x-1/2 bg-white shadow-[0_0_24px_6px_rgba(255,255,255,.7)]'
        />
        <div data-fx='black' aria-hidden className='pointer-events-none absolute inset-0 z-50 bg-[#050403] opacity-0' />
      </div>
    </div>
  )
}
