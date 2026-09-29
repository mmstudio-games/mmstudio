import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { type CSSProperties, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { useFinePointer, useReducedMotion } from '@/hooks/use-media-query'
import { onIntroDone } from '@/lib/intro'
import { cn } from '@/lib/utils'
import { usePreferencesStore } from '@/stores/preferences-store'

import { createTorchDust } from './torch-dust'

// 光束位置与半径由 tick 写入 --tx / --ty / --tr，不经过 React 渲染。
const SURFACE_MASK =
  'radial-gradient(circle var(--tr) at var(--tx) var(--ty), transparent 0%, transparent 56%, #000 100%)'
const TRUTH_MASK = 'radial-gradient(circle var(--tr) at var(--tx) var(--ty), #000 0%, #000 50%, transparent 100%)'
const maskStyle = (mask: string): CSSProperties => ({ maskImage: mask, WebkitMaskImage: mask })
const GLOW_STYLE: CSSProperties = {
  background:
    'radial-gradient(circle calc(var(--tr) * 2.2) at var(--tx) var(--ty), rgba(255, 214, 160, .13), rgba(255, 214, 160, .04) 45%, transparent 70%)',
}

function Word({ text, className, charClassName }: { text: string; className?: string; charClassName?: string }) {
  return (
    <span className={cn('inline-flex overflow-hidden py-[.06em]', className)}>
      {Array.from(text).map((char, index) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: 字符位置即身份
          key={index}
          data-hero-char
          className={cn('inline-block', charClassName)}
        >
          {char}
        </span>
      ))}
    </span>
  )
}

/** 表层与真意层共用的版式，保证两层逐字对齐。 */
function Composition({ layer }: { layer: 'surface' | 'truth' }) {
  const { t } = useTranslation()
  const locale = usePreferencesStore((state) => state.locale)
  const truth = layer === 'truth'
  const zh = locale === 'zh-CN'
  const strike = t('hero.truthStrike')

  return (
    <div className='absolute inset-0 flex flex-col px-[clamp(1.25rem,4vw,4.5rem)] pt-[calc(72px+2rem)] pb-36'>
      <div className='flex justify-end'>
        <p
          data-hero-fade
          className={cn(
            'max-w-[16rem] text-right font-mono text-[.68rem] leading-[1.8] tracking-[.2em]',
            truth ? 'text-accent' : 'text-muted-foreground',
          )}
        >
          {truth ? t('hero.choices') : t('hero.words')}
        </p>
      </div>

      <div className='flex flex-1 items-center justify-center'>
        <div
          className={cn(
            'relative leading-[.86]',
            zh
              ? 'font-serif-sc text-[min(40vw,46svh)] font-bold tracking-[-.02em] sm:text-[min(30vw,46svh)]'
              : 'font-heading text-[min(14.2vw,28svh)] font-medium tracking-[-.035em]',
          )}
        >
          {truth ? (
            <>
              <Word text={t('hero.truth')} className='text-accent' />
              {strike ? (
                <span className='relative'>
                  <Word text={strike} className='text-foreground/25' />
                  <span aria-hidden className='absolute inset-x-[-.04em] top-[52%] h-[.06em] -rotate-3 bg-accent' />
                </span>
              ) : null}
              <svg
                aria-hidden='true'
                viewBox='0 0 200 100'
                preserveAspectRatio='none'
                className={cn(
                  'pointer-events-none absolute -rotate-6 text-accent',
                  zh ? '-top-[4%] -right-[6%] h-[108%] w-[60%]' : '-top-[10%] -left-[4%] h-[120%] w-[70%]',
                )}
              >
                <path
                  d='M104 6C54 4 10 20 8 50s44 46 98 44 88-20 88-46S150 8 96 10C70 11 50 16 38 22'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='1.4'
                  vectorEffect='non-scaling-stroke'
                  strokeLinecap='round'
                />
              </svg>
            </>
          ) : (
            <Word text={t('hero.surface')} />
          )}
        </div>
      </div>

      {truth ? (
        <>
          <p className='absolute top-[28%] left-[clamp(1.25rem,7vw,8rem)] flex flex-col gap-1 font-mono text-[.66rem] tracking-[.18em] text-accent uppercase'>
            <span className='flex items-center gap-2'>
              <span className='h-px w-8 bg-current' /> CASE 001
            </span>
            <span className='text-foreground'>
              {t('nav.deadpan')} — {t('deadpan.status')}
            </span>
          </p>
          <p className='absolute right-[clamp(1.25rem,7vw,8rem)] bottom-[26%] flex flex-col items-end gap-1 font-mono text-[.66rem] tracking-[.18em] text-accent uppercase'>
            <span className='flex items-center gap-2'>
              CASE 002 <span className='h-px w-8 bg-current' />
            </span>
            <span className='text-foreground'>
              {t('nav.hgt')} — {t('hgt.status')}
            </span>
          </p>
        </>
      ) : null}
    </div>
  )
}

export function HomeHero() {
  const { t } = useTranslation()
  const root = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const hud = useRef<HTMLSpanElement>(null)
  const fine = useFinePointer()
  const reduced = useReducedMotion()

  // 光束：跟随指针；指针不在首屏内或触屏闲置时沿利萨如曲线游走；按下时放大。
  useEffect(() => {
    const section = root.current
    const surface = canvas.current
    if (!section || !surface) return

    const dust = createTorchDust(surface, window.innerWidth < 768 ? 80 : 170)
    let width = section.clientWidth
    let height = section.clientHeight
    let base = Math.min(280, Math.max(120, Math.min(width, height) * 0.24))
    const torch = { x: width * 0.6, y: height * 0.5, tx: width * 0.6, ty: height * 0.5, r: 0, tr: 0 }
    let inside = false
    let lastMove = -Infinity
    let pressed = false
    let visible = true
    let lastHud = 0

    const write = () => {
      section.style.setProperty('--tx', `${torch.x.toFixed(1)}px`)
      section.style.setProperty('--ty', `${torch.y.toFixed(1)}px`)
      section.style.setProperty('--tr', `${torch.r.toFixed(1)}px`)
    }
    const writeHud = () => {
      if (hud.current)
        hud.current.textContent = `X ${(torch.x / width).toFixed(3)} · Y ${(torch.y / height).toFixed(3)}`
    }

    const resize = new ResizeObserver(() => {
      width = section.clientWidth
      height = section.clientHeight
      base = Math.min(280, Math.max(120, Math.min(width, height) * 0.24))
      if (torch.tr > 0) torch.tr = pressed ? base * 1.6 : base
      dust.resize()
      if (reduced) {
        torch.x = width * 0.62
        torch.y = height * 0.5
        write()
        dust.draw(torch.x, torch.y, torch.r, 0, 0)
      }
    })
    resize.observe(section)

    if (reduced) {
      torch.r = torch.tr = base
      torch.x = width * 0.62
      torch.y = height * 0.5
      write()
      writeHud()
      dust.draw(torch.x, torch.y, torch.r, 0, 0)
      return () => resize.disconnect()
    }

    const aim = (event: PointerEvent) => {
      const rect = section.getBoundingClientRect()
      torch.tx = event.clientX - rect.left
      torch.ty = event.clientY - rect.top
      lastMove = performance.now()
    }
    const move = (event: PointerEvent) => {
      inside = event.pointerType === 'mouse' || event.pointerType === 'pen'
      aim(event)
    }
    const down = (event: PointerEvent) => {
      aim(event)
      pressed = true
      torch.tr = base * 1.6
    }
    const up = () => {
      pressed = false
      if (torch.tr > 0) torch.tr = base
    }
    const leave = () => {
      inside = false
      up()
    }
    section.addEventListener('pointermove', move)
    section.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    section.addEventListener('pointercancel', up)
    section.addEventListener('pointerleave', leave)

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    observer.observe(section)

    const stopIntro = onIntroDone(() => {
      torch.tr = base
    })

    const tick = (time: number, deltaTime: number) => {
      if (!visible || document.hidden) return
      const delta = Math.min(deltaTime, 64) / 1000
      if (!inside && performance.now() - lastMove > 2600) {
        const phase = time * 0.22
        torch.tx = width * (0.5 + 0.3 * Math.sin(phase * 1.3))
        torch.ty = height * (0.5 + 0.2 * Math.sin(phase * 2.1 + 1))
      }
      const follow = 1 - Math.exp(-delta * 7)
      torch.x += (torch.tx - torch.x) * follow
      torch.y += (torch.ty - torch.y) * follow
      torch.r += (torch.tr - torch.r) * (1 - Math.exp(-delta * (torch.r < torch.tr ? 3 : 6)))
      write()
      dust.draw(torch.x, torch.y, torch.r, delta, time)
      if (time - lastHud > 0.08) {
        lastHud = time
        writeHud()
      }
    }
    gsap.ticker.add(tick)

    return () => {
      gsap.ticker.remove(tick)
      stopIntro()
      resize.disconnect()
      observer.disconnect()
      section.removeEventListener('pointermove', move)
      section.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      section.removeEventListener('pointercancel', up)
      section.removeEventListener('pointerleave', leave)
    }
  }, [reduced])

  // 入场与滚动离场。
  useGSAP(
    () => {
      const media = gsap.matchMedia()
      media.add('(prefers-reduced-motion: no-preference)', () => {
        const intro = gsap.timeline({ paused: true })
        for (const layer of ['[data-hero-layer="surface"]', '[data-hero-layer="truth"]']) {
          intro.from(
            `${layer} [data-hero-char]`,
            { yPercent: 108, duration: 1.3, ease: 'expo.out', stagger: 0.07 },
            0.05,
          )
        }
        intro.from('[data-hero-fade]', { autoAlpha: 0, y: 16, duration: 1, ease: 'power3.out', stagger: 0.08 }, 0.35)
        const release = onIntroDone(() => intro.play())

        gsap.to('[data-hero-stage]', {
          yPercent: 14,
          autoAlpha: 0.15,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
        })
        return release
      })
      return () => media.revert()
    },
    { scope: root },
  )

  return (
    <section
      ref={root}
      aria-labelledby='hero-title'
      className={cn(
        'relative -mt-[72px] h-svh min-h-[560px] touch-pan-y overflow-hidden bg-[radial-gradient(ellipse_at_50%_45%,oklch(0.19_0.012_60),oklch(0.12_0.008_60)_70%)] select-none',
        fine && !reduced && 'cursor-none',
      )}
      style={{ '--tx': '60%', '--ty': '50%', '--tr': '0px' } as CSSProperties}
    >
      <h1 id='hero-title' className='sr-only'>
        {t('hero.srTitle')}
      </h1>

      <div data-hero-stage className='absolute inset-0'>
        <div aria-hidden className='absolute inset-0 mix-blend-screen' style={GLOW_STYLE} />
        <div aria-hidden data-hero-layer='surface' className='absolute inset-0' style={maskStyle(SURFACE_MASK)}>
          <Composition layer='surface' />
        </div>
        <div aria-hidden data-hero-layer='truth' className='absolute inset-0' style={maskStyle(TRUTH_MASK)}>
          <Composition layer='truth' />
        </div>
        <canvas ref={canvas} aria-hidden className='pointer-events-none absolute inset-0 size-full mix-blend-screen' />
      </div>

      <div className='pointer-events-none absolute inset-x-0 bottom-0 grid grid-cols-1 items-end gap-4 px-[clamp(1.25rem,4vw,4.5rem)] pb-8 sm:grid-cols-[1fr_auto_1fr]'>
        <p data-hero-fade className='max-w-[22rem] text-[.95rem] leading-[1.7] text-foreground/85'>
          {t('hero.lede')}
        </p>
        <p
          data-hero-fade
          aria-hidden
          className='hidden items-center gap-3 font-mono text-[.64rem] tracking-[.2em] text-muted-foreground uppercase sm:flex'
        >
          <span className='size-1.5 animate-pulse bg-accent' />
          {fine ? t('hero.hint') : t('hero.hintTouch')}
        </p>
        <div
          data-hero-fade
          aria-hidden
          className='hidden flex-col items-end gap-2 font-mono text-[.64rem] tracking-[.2em] text-muted-foreground uppercase sm:flex'
        >
          <span ref={hud} className='tabular-nums'>
            X 0.600 · Y 0.500
          </span>
          <span className='flex items-center gap-3 text-foreground'>
            {t('hero.scroll')}
            <span className='relative block h-8 w-px overflow-hidden bg-border'>
              <span className='absolute inset-x-0 top-0 h-1/2 animate-scroll-cue bg-accent' />
            </span>
          </span>
        </div>
      </div>
    </section>
  )
}
