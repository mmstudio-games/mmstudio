import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import finePaper from '@/assets/textures/fine-paper.webp'
import { matches, REDUCED_MOTION } from '@/hooks/use-media-query'
import { markIntroDone } from '@/lib/intro'

const SEEN_KEY = 'mm-intro-seen'
const SAFELIGHT = '178, 22, 12'
const PAPER_RED = '#b48a84'
const PAPER_WHITE = '#efe6d6'
const INK_FAINT = '#a8837d'
const INK_DARK = '#1a1110'

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

  useGSAP(
    () => {
      const scope = root.current
      if (!scope) return
      const q = <T extends Element>(selector: string) => scope.querySelector<T>(selector)
      const count = q<HTMLSpanElement>('[data-count]')
      const threshold = q<SVGFEFuncAElement>('[data-threshold]')
      const blur = q<SVGFEGaussianBlurElement>('[data-blur]')
      const ink = q<SVGGElement>('[data-ink]')
      const ripple = q<SVGFETurbulenceElement>('[data-ripple]')
      const warp = q<SVGFEDisplacementMapElement>('[data-warp]')
      const fonts = document.fonts?.ready ?? Promise.resolve()
      const inkFade = gsap.utils.interpolate(INK_FAINT, INK_DARK)

      // 显影：噪声阈值下降使图像一块块浮现，模糊减小，墨色由浅变深。
      const develop = (p: number) => {
        threshold?.setAttribute('intercept', (-5.4 + p * 6.6).toFixed(3))
        blur?.setAttribute('stdDeviation', ((1 - p) * 3.2).toFixed(2))
        const color = inkFade(Math.min(1, p * 1.15))
        ink?.setAttribute('fill', color)
        ink?.style.setProperty('color', color)
        if (count) count.textContent = String(Math.round(p * 100)).padStart(3, '0')
      }
      develop(0)

      // 药水轻晃：扰动频率缓慢漂移。
      const wave = { t: 0 }
      const slosh = gsap.to(wave, {
        t: 1,
        duration: 3.4,
        repeat: -1,
        ease: 'none',
        onUpdate: () => {
          const a = wave.t * Math.PI * 2
          ripple?.setAttribute(
            'baseFrequency',
            `${(0.006 + Math.sin(a) * 0.0015).toFixed(4)} ${(0.012 + Math.cos(a) * 0.002).toFixed(4)}`,
          )
        },
      })

      const state = { p: 0 }
      const timeline = gsap.timeline({
        delay: 0.2,
        onComplete: () => {
          slosh.kill()
          try {
            sessionStorage.setItem(SEEN_KEY, '1')
          } catch {
            // 无法写入时下次仍会播放，不影响使用。
          }
          onDone()
        },
      })

      timeline
        .fromTo('[data-glow]', { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'steps(4)' }, 0)
        .fromTo('[data-lamp]', { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'steps(4)' }, 0)
        .from('[data-corner]', { autoAlpha: 0, y: 10, duration: 0.8, stagger: 0.08, ease: 'expo.out' }, 0.2)
        .from('[data-tray]', { autoAlpha: 0, y: 24, duration: 1, ease: 'expo.out' }, 0.15)
        .fromTo('[data-sheen]', { xPercent: -120 }, { xPercent: 120, duration: 2.4, ease: 'sine.inOut' }, 0.3)
        .to(state, { p: 1, duration: 1.9, ease: 'power1.in', onUpdate: () => develop(state.p) }, 0.35)
        .to(warp, { attr: { scale: 1.5 }, duration: 1.9, ease: 'power1.in' }, 0.35)
        // 字体就绪后再关灯定影，避免字标闪换字体。
        .addPause('+=0.05', () => {
          void fonts.then(() => timeline.resume())
        })
        // 咔哒：安全灯熄灭，房间灯亮起，相纸显出真实颜色。
        .to('[data-dot]', { opacity: 0.2, duration: 0.05 })
        .to('[data-glow], [data-lamp], [data-tint]', { opacity: 0, duration: 0.12, ease: 'none' }, '<')
        .to('[data-roomlight]', { opacity: 1, duration: 0.25, ease: 'power2.out' }, '<0.05')
        .to('[data-paper]', { backgroundColor: PAPER_WHITE, duration: 0.35, ease: 'power2.out' }, '<')
        .to(warp, { attr: { scale: 0 }, duration: 0.4 }, '<')
        // 幕布带弧度上拉，首屏入场同时开始。
        .to('[data-corner]', { autoAlpha: 0, duration: 0.3 }, '+=0.4')
        .add(markIntroDone)
        .set('[data-room]', { autoAlpha: 0 })
        .to('[data-curtain]', { attr: { d: 'M0 0 H100 V42 Q50 70 0 42 Z' }, duration: 0.55, ease: 'power3.in' }, '<')
        .to('[data-curtain]', { attr: { d: 'M0 0 H100 V0 Q50 0 0 0 Z' }, duration: 0.6, ease: 'power3.out' })

      return () => slosh.kill()
    },
    { scope: root },
  )

  return (
    <div ref={root} aria-hidden className='fixed inset-0 z-[100] text-foreground'>
      <svg aria-hidden='true' viewBox='0 0 100 100' preserveAspectRatio='none' className='absolute inset-0 size-full'>
        <path data-curtain d='M0 0 H100 V100 Q50 100 0 100 Z' style={{ fill: 'var(--background)' }} />
      </svg>

      <div data-room className='absolute inset-0 overflow-hidden bg-background'>
        <span
          data-lamp
          className='absolute top-0 left-1/2 h-2.5 w-28 -translate-x-1/2'
          style={{ background: `rgb(${SAFELIGHT})`, boxShadow: `0 0 40px 12px rgba(${SAFELIGHT}, .6)` }}
        />
        <span
          data-glow
          className='absolute -inset-x-[10%] -top-[20%] h-[90%] mix-blend-screen'
          style={{
            background: `radial-gradient(ellipse at 50% 0%, rgba(${SAFELIGHT}, .55), rgba(${SAFELIGHT}, .16) 38%, transparent 70%)`,
          }}
        />

        {/* 显影盘与相纸 */}
        <div
          data-tray
          className='absolute top-[52%] left-1/2 aspect-[3/2] w-[min(88vw,760px)] -translate-1/2 rotate-[-1.2deg] rounded-[14px] p-[5.5%] md:w-[min(62vw,760px)]'
          style={{
            background: 'linear-gradient(180deg, #151110, #0c0a09)',
            boxShadow:
              'inset 0 0 0 1px rgba(255,255,255,.04), inset 0 18px 40px rgba(0,0,0,.8), 0 30px 80px rgba(0,0,0,.6)',
          }}
        >
          <span
            className='absolute inset-[3%] rounded-[10px] shadow-[inset_0_0_40px_rgba(0,0,0,.6)]'
            style={{ background: `linear-gradient(170deg, rgba(${SAFELIGHT}, .1), rgba(0,0,0,.2))` }}
          />
          <div
            data-paper
            className='relative size-full overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,.55)]'
            style={{
              backgroundColor: PAPER_RED,
              backgroundImage: `linear-gradient(115deg, rgba(255,255,255,.1), transparent 35%, transparent 65%, rgba(0,0,0,.16)), url(${finePaper})`,
              backgroundSize: '100% 100%, 380px',
              backgroundBlendMode: 'soft-light, multiply',
            }}
          >
            <svg aria-hidden='true' viewBox='0 0 600 400' className='absolute inset-0 size-full'>
              <defs>
                <filter id='mm-develop-field' x='0' y='0' width='600' height='400' filterUnits='userSpaceOnUse'>
                  <feTurbulence type='fractalNoise' baseFrequency='0.011' numOctaves='3' seed='4' />
                  <feColorMatrix type='matrix' values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1.4 0 0 0 0' />
                  <feComponentTransfer>
                    <feFuncA data-threshold type='linear' slope='5' intercept='-5.4' />
                  </feComponentTransfer>
                </filter>
                <mask id='mm-develop-mask' maskUnits='userSpaceOnUse' x='0' y='0' width='600' height='400'>
                  <rect width='600' height='400' fill='white' filter='url(#mm-develop-field)' />
                </mask>
                <filter id='mm-develop-soft' x='-5%' y='-5%' width='110%' height='110%'>
                  <feGaussianBlur data-blur stdDeviation='3.2' />
                </filter>
                <filter id='mm-slosh' x='-3%' y='-3%' width='106%' height='106%'>
                  <feTurbulence data-ripple type='fractalNoise' baseFrequency='0.006 0.012' numOctaves='2' seed='2' />
                  <feDisplacementMap data-warp in='SourceGraphic' scale='6' xChannelSelector='R' yChannelSelector='G' />
                </filter>
              </defs>
              <g filter='url(#mm-slosh)'>
                <g data-ink fill={INK_FAINT} mask='url(#mm-develop-mask)' filter='url(#mm-develop-soft)'>
                  <rect x='36' y='30' width='528' height='340' fill='none' stroke='currentColor' strokeWidth='1' />
                  <text
                    x='300'
                    y='212'
                    textAnchor='middle'
                    className='font-heading'
                    fontSize='168'
                    fontWeight='600'
                    letterSpacing='-12'
                  >
                    MM
                  </text>
                  <text
                    x='306'
                    y='252'
                    textAnchor='middle'
                    className='font-serif-sc'
                    fontSize='15'
                    fontWeight='700'
                    letterSpacing='9'
                  >
                    STUDIO
                  </text>
                  <rect x='162' y='278' width='276' height='1' />
                  <text x='300' y='306' textAnchor='middle' className='font-mono' fontSize='8.5' letterSpacing='2.6'>
                    MEANINGLESS WORDS. MEANINGFUL CHOICES.
                  </text>
                </g>
              </g>
            </svg>
            {/* 液面反光：一道柔光缓慢掠过 */}
            <span
              data-sheen
              className='pointer-events-none absolute inset-y-0 -left-1/4 w-2/3 mix-blend-screen'
              style={{
                background:
                  'linear-gradient(100deg, transparent, rgba(255,210,200,.14) 45%, rgba(255,230,220,.22) 50%, rgba(255,210,200,.14) 55%, transparent)',
              }}
            />
          </div>
        </div>

        <span
          data-tint
          className='absolute inset-0 mix-blend-multiply'
          style={{ background: `rgba(${SAFELIGHT}, .1)` }}
        />
        <span
          data-roomlight
          className='absolute inset-0 opacity-0'
          style={{
            background:
              'radial-gradient(ellipse at 50% 30%, rgba(255, 244, 222, .32), rgba(255, 244, 222, .08) 60%, transparent 80%)',
          }}
        />

        <div className='absolute inset-0 flex flex-col justify-between p-[clamp(1.25rem,4vw,4.5rem)] pt-7'>
          <p data-corner className='flex items-baseline font-heading leading-none text-[#ecd2c8]/85'>
            <span className='text-[1.65rem] font-semibold tracking-[-.1em]'>MM</span>
            <span className='ml-[.45rem] font-sans text-[.58rem] font-bold tracking-[.22em]'>STUDIO</span>
          </p>
          <div className='flex items-end justify-between gap-6'>
            <p
              data-corner
              className='flex items-center font-mono text-[.66rem] tracking-[.22em] text-[#ecc8be]/70 uppercase'
            >
              <span
                data-dot
                className='mr-2.5 size-1.5'
                style={{ background: `rgb(${SAFELIGHT})`, boxShadow: `0 0 10px rgba(${SAFELIGHT}, .9)` }}
              />
              {t('intro.room')} · {t('intro.developing')}
            </p>
            <p
              data-corner
              className='flex flex-col items-end gap-1 font-mono text-[.66rem] tracking-[.22em] text-[#ecc8be]/70 uppercase'
            >
              {t('intro.count')}
              <span
                data-count
                className='font-heading text-[2.75rem] leading-none tracking-[-.02em] text-[#ecd2c8]/90 tabular-nums'
              >
                000
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 每个会话首次进入时的加载页「暗室显影」：安全灯下字标在相纸上显影，关灯定影后幕布弧形上拉。 */
export function Preloader() {
  const [visible, setVisible] = useState(shouldShow)

  useEffect(() => {
    if (!visible) markIntroDone()
  }, [visible])

  return visible ? <PreloaderScreen onDone={() => setVisible(false)} /> : null
}
