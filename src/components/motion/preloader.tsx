import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { matches, REDUCED_MOTION } from '@/hooks/use-media-query'
import { markIntroDone } from '@/lib/intro'

const SEEN_KEY = 'mm-intro-seen'

function shouldShow() {
  if (matches(REDUCED_MOTION)) return false
  try {
    return sessionStorage.getItem(SEEN_KEY) === null
  } catch {
    return true
  }
}

function PreloaderScreen({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation()
  const root = useRef<HTMLDivElement>(null)
  const count = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const counter = { value: 0 }
      const fonts = document.fonts?.ready ?? Promise.resolve()
      const timeline = gsap.timeline({
        onComplete: () => {
          try {
            sessionStorage.setItem(SEEN_KEY, '1')
          } catch {
            // 无法写入时下次仍会播放，不影响使用。
          }
          onDone()
        },
      })

      timeline
        .from('[data-intro-line]', { yPercent: 110, duration: 0.8, ease: 'expo.out', stagger: 0.06 })
        .to(
          counter,
          {
            value: 100,
            duration: 1.25,
            ease: 'power2.inOut',
            onUpdate: () => {
              if (count.current) count.current.textContent = String(Math.round(counter.value)).padStart(3, '0')
            },
          },
          0.1,
        )
        .fromTo('[data-intro-bar]', { scaleX: 0 }, { scaleX: 1, duration: 1.25, ease: 'power2.inOut' }, 0.1)
        .addPause('+=0.05', () => {
          void fonts.then(() => timeline.resume())
        })
        .to('[data-intro-content]', { autoAlpha: 0, duration: 0.3, ease: 'power2.in' })
        .add(markIntroDone)
        .to('[data-intro-top]', { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '<')
        .to('[data-intro-bottom]', { yPercent: 100, duration: 1, ease: 'expo.inOut' }, '<')
        .to('[data-intro-bar]', { scaleY: 0, duration: 0.5, ease: 'power2.in' }, '<')
    },
    { scope: root },
  )

  return (
    <div ref={root} aria-hidden className='fixed inset-0 z-[100] text-foreground'>
      <div data-intro-top className='absolute inset-x-0 top-0 h-1/2 bg-background' />
      <div data-intro-bottom className='absolute inset-x-0 bottom-0 h-1/2 bg-background' />
      <div data-intro-bar className='absolute inset-x-0 top-1/2 h-px origin-left bg-accent' />
      <div
        data-intro-content
        className='absolute inset-0 flex flex-col justify-between p-[clamp(1.25rem,4vw,4.5rem)] pt-7'
      >
        <div className='overflow-hidden'>
          <p data-intro-line className='flex items-baseline font-heading leading-none'>
            <span className='text-[1.65rem] font-semibold tracking-[-.1em]'>MM</span>
            <span className='ml-[.45rem] font-sans text-[.58rem] font-bold tracking-[.22em]'>STUDIO</span>
          </p>
        </div>
        <div className='flex items-end justify-between gap-6'>
          <div className='overflow-hidden pb-2'>
            <p data-intro-line className='font-mono text-[.7rem] tracking-[.2em] uppercase'>
              {t('intro.loading')}
              <span className='ml-1 animate-blink text-accent'>▌</span>
            </p>
          </div>
          <div className='-mb-[.08em] overflow-hidden'>
            <span
              data-intro-line
              ref={count}
              className='block font-heading text-[clamp(5rem,18vw,16rem)] leading-[.95] font-medium tracking-[-.04em] tabular-nums'
            >
              000
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 每个会话首次进入时的预加载幕：计数到 100 并等字体就绪后，沿朱红线上下分开。 */
export function Preloader() {
  const [visible, setVisible] = useState(shouldShow)

  useEffect(() => {
    if (!visible) markIntroDone()
  }, [visible])

  return visible ? <PreloaderScreen onDone={() => setVisible(false)} /> : null
}
