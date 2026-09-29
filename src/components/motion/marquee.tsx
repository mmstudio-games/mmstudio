import { gsap } from 'gsap'
import { type ReactNode, useEffect, useRef } from 'react'

import { useReducedMotion } from '@/hooks/use-media-query'
import { getLenis } from '@/lib/smooth-scroll'
import { cn } from '@/lib/utils'

/** 无限跑马灯：随滚动速度加速、倾斜，并跟随滚动方向换向。 */
export function Marquee({
  children,
  speed = 50,
  className,
}: {
  children: ReactNode
  speed?: number
  className?: string
}) {
  const root = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const container = root.current
    const element = track.current
    if (!container || !element || reduced) return
    let half = element.scrollWidth / 2
    let x = 0
    let skew = 0
    let direction = 1
    let visible = false

    const resize = new ResizeObserver(() => {
      half = element.scrollWidth / 2
    })
    resize.observe(element)
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    observer.observe(container)

    const tick = (_time: number, deltaTime: number) => {
      if (!visible || half === 0) return
      const velocity = getLenis()?.velocity ?? 0
      if (Math.abs(velocity) > 0.5) direction = Math.sign(velocity)
      const boost = 1 + Math.min(Math.abs(velocity) * 0.18, 7)
      x -= direction * speed * boost * (deltaTime / 1000)
      if (x <= -half) x += half
      if (x > 0) x -= half
      skew += (Math.max(-10, Math.min(10, velocity * 0.35)) - skew) * 0.12
      element.style.transform = `translate3d(${x}px,0,0) skewX(${-skew}deg)`
    }
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      resize.disconnect()
      observer.disconnect()
    }
  }, [reduced, speed])

  return (
    <div ref={root} className={cn('overflow-hidden', className)}>
      <div ref={track} className='flex w-max will-change-transform'>
        {[0, 1].map((copy) => (
          <div key={copy} aria-hidden={copy === 1} className='flex shrink-0'>
            {children}
            {children}
            {children}
          </div>
        ))}
      </div>
    </div>
  )
}
