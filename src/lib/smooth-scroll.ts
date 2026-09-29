import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

import { onIntroDone } from '@/lib/intro'

gsap.registerPlugin(ScrollTrigger)

let instance: Lenis | null = null

/** 全站共享的 Lenis 实例；减少动态效果时为 null。 */
export function getLenis() {
  return instance
}

/** 创建 Lenis 并接入 GSAP ticker 与 ScrollTrigger，返回清理函数。 */
export function startSmoothScroll() {
  const lenis = new Lenis({ lerp: 0.1 })
  instance = lenis
  lenis.on('scroll', ScrollTrigger.update)
  const tick = (time: number) => lenis.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  // 预加载期间锁定滚动。
  lenis.stop()
  const release = onIntroDone(() => lenis.start())

  return () => {
    release()
    gsap.ticker.remove(tick)
    lenis.destroy()
    if (instance === lenis) instance = null
  }
}

export function scrollToTop(immediate = false) {
  if (instance) instance.scrollTo(0, { immediate, force: true, duration: 1.6 })
  else window.scrollTo({ top: 0, behavior: immediate ? 'instant' : 'smooth' })
}
