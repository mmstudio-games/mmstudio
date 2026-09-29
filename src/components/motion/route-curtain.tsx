import { gsap } from 'gsap'
import { useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'

import { matches, REDUCED_MOTION } from '@/hooks/use-media-query'

const LABELS: Record<string, string> = {
  '/': 'nav.home',
  '/games/deadpan': 'nav.deadpan',
  '/news': 'nav.news',
  '/about': 'nav.about',
  '/contact': 'nav.contact',
}

/** 路由转场：新页面渲染前以墨色幕布盖住，显示目的地名称后自下而上揭开。 */
export function RouteCurtain() {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const root = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const first = useRef(true)

  useLayoutEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const element = root.current
    const text = label.current
    if (!element || !text || matches(REDUCED_MOTION)) return
    text.textContent = t(LABELS[pathname] ?? 'nav.home')

    const timeline = gsap
      .timeline()
      .set(element, { display: 'flex', clipPath: 'inset(0% 0% 0% 0%)' })
      .fromTo(text, { yPercent: 110 }, { yPercent: 0, duration: 0.55, ease: 'expo.out' })
      .fromTo('[data-curtain-bar]', { scaleX: 0 }, { scaleX: 1, duration: 0.55, ease: 'expo.out' }, '<')
      .to(element, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.9, ease: 'expo.inOut' }, '+=0.1')
      .set(element, { display: 'none' })

    return () => {
      timeline.kill()
      gsap.set(element, { display: 'none' })
    }
  }, [pathname, t])

  return (
    <div
      ref={root}
      aria-hidden
      className='fixed inset-0 z-[95] hidden flex-col items-center justify-center gap-6 bg-background text-foreground'
    >
      <span className='overflow-hidden'>
        <span
          ref={label}
          className='block font-heading text-[clamp(3rem,9vw,8rem)] leading-none font-medium tracking-[-.03em]'
        />
      </span>
      <span data-curtain-bar className='block h-px w-40 origin-left bg-accent' />
    </div>
  )
}
