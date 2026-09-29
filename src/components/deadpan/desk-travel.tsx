import { gsap } from 'gsap'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import finePaper from '@/assets/textures/fine-paper.webp'
import { matches, REDUCED_MOTION } from '@/hooks/use-media-query'
import { getLenis } from '@/lib/smooth-scroll'

type Travel = {
  /** 目标章节标题的 id；为空表示回到首屏桌面。 */
  targetId: string | null
  label: string
  /** 被拿起的物件（按钮），会先抬起再向右飞出。 */
  from?: HTMLElement | null
}

const EVENT = 'dp:travel'
const HERO_ID = 'dp-hero-title'
const PEN = '#b8321f'

/** 触发一次左右推拉转场。 */
export function travel(detail: Travel) {
  window.dispatchEvent(new CustomEvent<Travel>(EVENT, { detail }))
}

function jumpTo(targetId: string | null) {
  const section = targetId ? document.getElementById(targetId)?.closest('section') : null
  const lenis = getLenis()
  if (section) {
    if (lenis) lenis.scrollTo(section, { immediate: true, force: true })
    else section.scrollIntoView({ behavior: 'instant' })
  } else if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
  else window.scrollTo({ top: 0, behavior: 'instant' })
  return section ?? document.getElementById(HERO_ID)?.closest('section') ?? null
}

/** 转场结束后把焦点交给目标标题，读屏与键盘都从那里继续。 */
function focusHeading(id: string) {
  const heading = document.getElementById(id)
  if (!heading) return
  if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1')
  heading.focus({ preventScroll: true })
}

/**
 * 调查桌的左右推拉转场与「回到桌面」入口。
 * 向前：物件拿起→向右飞出，桌面左滑；纸幕从右推入盖满后瞬间跳到目标章节，再向左退出，章节从右侧推入。
 * 回到桌面：方向相反。
 */
export function DeskTravel() {
  const { t } = useTranslation()
  const curtain = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const stroke = useRef<SVGPathElement>(null)
  const busy = useRef(false)
  const [traveled, setTraveled] = useState(false)
  const [heroVisible, setHeroVisible] = useState(true)

  useEffect(() => {
    const hero = document.getElementById(HERO_ID)?.closest('section')
    if (!hero) return
    const observer = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting), {
      threshold: 0.15,
    })
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const run = (event: Event) => {
      const { targetId, label: text, from } = (event as CustomEvent<Travel>).detail
      const sheet = curtain.current
      if (busy.current || !sheet || !label.current || !stroke.current) return
      const back = targetId === null
      const headingId = targetId ?? HERO_ID

      if (matches(REDUCED_MOTION)) {
        jumpTo(targetId)
        focusHeading(headingId)
        setTraveled(!back)
        return
      }

      busy.current = true
      label.current.textContent = text
      const desk = document.querySelector<HTMLElement>('[data-desk-frame]')
      const enter = back ? -100 : 100
      const timeline = gsap.timeline({
        defaults: { ease: 'expo.inOut' },
        onComplete: () => {
          gsap.set(sheet, { display: 'none' })
          busy.current = false
          focusHeading(headingId)
        },
      })

      timeline.set(sheet, { display: 'flex', xPercent: enter })
      timeline.set(stroke.current, { strokeDashoffset: 1 })

      if (from && !back) {
        // 拿起：抬高、转正，再朝右飞出画面。
        timeline
          .to(from, { y: -24, rotation: 0, scale: 1.08, duration: 0.3, ease: 'power3.out' }, 0)
          .to(from, { x: () => window.innerWidth, rotation: 10, duration: 0.75, ease: 'power3.in' }, 0.24)
      }
      if (desk && !back) timeline.to(desk, { x: '-28vw', autoAlpha: 0.5, duration: 0.9, ease: 'power3.in' }, 0.18)

      timeline
        .to(sheet, { xPercent: 0, duration: 0.8 }, back ? 0 : 0.34)
        .to(stroke.current, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' }, '-=0.25')
        .add(() => {
          const section = jumpTo(targetId)
          if (from) gsap.set(from, { clearProps: 'transform' })
          if (desk) gsap.set(desk, { clearProps: 'transform,opacity,visibility' })
          setTraveled(!back)
          // 目标从转场幕退出的方向一侧推入
          const incoming = back ? desk : section
          if (incoming)
            gsap.fromTo(
              incoming,
              { x: back ? '-8vw' : '8vw' },
              { x: 0, duration: 1.1, ease: 'expo.out', delay: 0.3, clearProps: 'transform' },
            )
        })
        .to(sheet, { xPercent: back ? 100 : -100, duration: 0.85 }, '+=0.3')
    }

    window.addEventListener(EVENT, run)
    return () => window.removeEventListener(EVENT, run)
  }, [])

  const showBack = traveled && !heroVisible

  return (
    <>
      <div
        ref={curtain}
        aria-hidden
        className='fixed inset-0 z-[85] hidden flex-col items-center justify-center gap-4 drop-shadow-[0_0_40px_rgba(0,0,0,.6)]'
      >
        <div
          className='absolute inset-y-0 -inset-x-[3vw]'
          style={{
            backgroundColor: '#efe4cb',
            backgroundImage: `radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(110,70,25,.3) 100%), url(${finePaper})`,
            backgroundSize: '100% 100%, 420px',
            backgroundBlendMode: 'multiply, multiply',
            clipPath:
              'polygon(1.2% 0, 98.8% 0, 99.4% 12%, 98.6% 26%, 99.5% 41%, 98.7% 57%, 99.3% 72%, 98.6% 88%, 99.2% 100%, 0.8% 100%, 1.4% 86%, 0.6% 70%, 1.3% 55%, 0.5% 39%, 1.2% 24%, 0.6% 10%)',
          }}
        />
        <span className='relative font-mono text-[.7rem] tracking-[.3em] text-[#17120d]/60 uppercase'>
          CASE FILE 001
        </span>
        <span className='relative'>
          <span
            ref={label}
            className='block font-hand text-[clamp(3.5rem,9vw,8rem)] leading-none [filter:url(#dp-type)]'
            style={{ color: PEN }}
          />
          <svg
            aria-hidden='true'
            viewBox='0 0 200 20'
            preserveAspectRatio='none'
            className='absolute -bottom-[.4em] left-[-6%] h-[.5em] w-[112%] overflow-visible text-[clamp(3.5rem,9vw,8rem)]'
          >
            <path
              ref={stroke}
              d='M2 12 C 40 4 90 16 130 9 S 190 8 198 12'
              pathLength={1}
              fill='none'
              stroke={PEN}
              strokeWidth='2.2'
              strokeLinecap='round'
              vectorEffect='non-scaling-stroke'
              style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
            />
          </svg>
        </span>
      </div>

      <button
        type='button'
        tabIndex={showBack ? 0 : -1}
        aria-hidden={!showBack}
        data-cursor={t('dp.desk.back')}
        onClick={() => travel({ targetId: null, label: t('dp.desk.back') })}
        className={
          'fixed bottom-6 left-[clamp(1rem,3vw,3rem)] z-40 flex items-center gap-2 border border-[#17120d]/30 bg-[#efe4cb] px-4 py-2.5 font-mono text-[.66rem] tracking-[.18em] text-[#17120d] uppercase shadow-[0_10px_24px_rgba(0,0,0,.45)] transition-[translate,opacity] duration-500 ease-out-expo hover:bg-[#f7efdc] ' +
          (showBack ? 'translate-x-0 opacity-100' : 'pointer-events-none -translate-x-6 opacity-0')
        }
      >
        <ArrowLeft aria-hidden className='size-3.5' />
        {t('dp.desk.back')}
      </button>
    </>
  )
}
