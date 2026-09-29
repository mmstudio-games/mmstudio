import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router-dom'

import { CursorFollower } from '@/components/motion/cursor-follower'
import { GrainOverlay } from '@/components/motion/grain-overlay'
import { Preloader } from '@/components/motion/preloader'
import { RouteCurtain } from '@/components/motion/route-curtain'
import { SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'
import { useReducedMotion } from '@/hooks/use-media-query'
import { scrollToTop, startSmoothScroll } from '@/lib/smooth-scroll'
import { usePreferencesStore } from '@/stores/preferences-store'

function setMetaContent(selector: string, content: string) {
  document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', content)
}

export function SiteLayout() {
  const { t, i18n } = useTranslation()
  const locale = usePreferencesStore((state) => state.locale)
  const reduced = useReducedMotion()
  const { pathname } = useLocation()
  const main = useRef<HTMLElement>(null)

  useEffect(() => {
    let cancelled = false

    void i18n.changeLanguage(locale).then(() => {
      if (cancelled) return

      const translate = i18n.getFixedT(locale)
      document.documentElement.lang = locale
      document.title = translate('meta.title')
      setMetaContent('meta[name="description"]', translate('meta.description'))
      setMetaContent('meta[property="og:title"]', translate('meta.ogTitle'))
      setMetaContent('meta[property="og:description"]', translate('meta.ogDescription'))
    })

    return () => {
      cancelled = true
    }
  }, [i18n, locale])

  useEffect(() => (reduced ? undefined : startSmoothScroll()), [reduced])

  // 换页时回到顶部；刷新时也从顶部开始，避免浏览器恢复的位置与预加载、吸顶段落冲突。
  useLayoutEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  }, [])
  useLayoutEffect(() => {
    if (pathname) scrollToTop(true)
  }, [pathname])

  // 正文高度变化（换页、字体加载、懒加载）后重新计算滚动触发位置。
  useEffect(() => {
    const element = main.current
    if (!element) return
    let timer = 0
    const observer = new ResizeObserver(() => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => ScrollTrigger.refresh(), 120)
    })
    observer.observe(element)
    void document.fonts?.ready.then(() => ScrollTrigger.refresh())
    return () => {
      window.clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  return (
    <div className='relative'>
      <Preloader />
      <RouteCurtain />
      <CursorFollower />
      <GrainOverlay />
      <a
        className='fixed -top-16 left-4 z-[110] bg-primary px-4 py-3 text-primary-foreground focus:top-4'
        href='#main-content'
      >
        {t('a11y.skipToContent')}
      </a>
      <SiteHeader />
      <main id='main-content' ref={main} className='relative z-10 bg-background'>
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
