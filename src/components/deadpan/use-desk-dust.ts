import { gsap } from 'gsap'
import { type RefObject, useEffect, useRef } from 'react'

import { onIntroDone } from '@/lib/intro'

import { createDustLayer } from './dust-layer'

/** 拂去约四成后，余灰自动散去。 */
export const DUST_REVEAL_AT = 0.42

type Options = {
  /** 舞台元素：指针在上面移动就是拂尘；灰尘画布铺满它。 */
  area: RefObject<HTMLElement | null>
  dust: RefObject<HTMLCanvasElement | null>
  motes: RefObject<HTMLCanvasElement | null>
  enabled: boolean
  /** 精确指针设备：入场自动拂一笔；触屏自动拂几笔后直接散尽。 */
  fine: boolean
  onProgress: (value: number) => void
  onReveal: () => void
}

/**
 * 积案拂尘页首屏的灰尘：沿指针擦除，进度达到阈值后爆开并散去。
 * 返回的函数可以随时让余灰散去（滚动、点击、键盘聚焦时调用）。
 */
export function useDeskDust({ area, dust, motes, enabled, fine, onProgress, onReveal }: Options) {
  const finish = useRef<() => void>(() => {})
  const progress = useRef(onProgress)
  const reveal = useRef(onReveal)
  progress.current = onProgress
  reveal.current = onReveal

  useEffect(() => {
    const element = area.current
    const dustCanvas = dust.current
    const moteCanvas = motes.current
    if (!enabled || !element || !dustCanvas || !moteCanvas) return

    const layer = createDustLayer(dustCanvas, moteCanvas)
    let finished = false
    let shown = 0
    let last: { x: number; y: number } | null = null
    const timelines: gsap.core.Animation[] = []

    const done = () => {
      if (finished) return
      finished = true
      layer.burst()
      gsap.to(dustCanvas, { opacity: 0, duration: 1.3, ease: 'power2.inOut' })
      reveal.current()
    }
    finish.current = done
    const report = (value: number) => {
      const percent = Math.floor(value * 100)
      if (percent !== shown) {
        shown = percent
        progress.current(value)
      }
      if (value >= DUST_REVEAL_AT) done()
    }
    const wipe = (x0: number, y0: number, x1: number, y1: number) => {
      if (!finished) report(layer.wipe(x0, y0, x1, y1))
    }

    // 只有尺寸真的变了才重铺灰尘（observe 时的首次回调不算）。
    let size = `${element.clientWidth}x${element.clientHeight}`
    const resize = new ResizeObserver(() => {
      const next = `${element.clientWidth}x${element.clientHeight}`
      if (finished || next === size) return
      size = next
      layer.resize()
      report(0)
    })
    resize.observe(element)

    const move = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      if (last) wipe(last.x, last.y, x, y)
      last = { x, y }
    }
    const leave = () => {
      last = null
    }
    element.addEventListener('pointermove', move)
    element.addEventListener('pointerleave', leave)

    // 入场后自动拂几笔作提示。
    const release = onIntroDone(() => {
      const strokes = fine ? 1 : 4
      const timeline = gsap.timeline({ delay: 0.5, onComplete: fine ? undefined : () => gsap.delayedCall(0.6, done) })
      for (let i = 0; i < strokes; i++) {
        const state = { p: 0 }
        let previous: { x: number; y: number } | null = null
        const row = strokes === 1 ? 0.42 : 0.22 + i * 0.18
        timeline.to(state, {
          p: 1,
          duration: 1.1,
          ease: 'power2.inOut',
          onUpdate: () => {
            const w = element.clientWidth
            const h = element.clientHeight
            const x = w * (0.2 + 0.6 * state.p)
            const y = h * (row + Math.sin(state.p * Math.PI * 2) * 0.06)
            if (previous) wipe(previous.x, previous.y, x, y)
            previous = { x, y }
          },
        })
      }
      timelines.push(timeline)
    })

    return () => {
      finish.current = () => {}
      release()
      for (const timeline of timelines) timeline.kill()
      resize.disconnect()
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerleave', leave)
      layer.dispose()
    }
  }, [area, dust, motes, enabled, fine])

  return () => finish.current()
}
