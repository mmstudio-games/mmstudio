import { gsap } from 'gsap'
import { type ReactNode, useEffect, useRef } from 'react'

import { useFinePointer, useReducedMotion } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

/** 磁吸：子元素随指针轻微偏移，离开时弹回。外层留出感应边距。 */
export function Magnetic({
  children,
  strength = 0.35,
  className,
}: {
  children: ReactNode
  strength?: number
  className?: string
}) {
  const zone = useRef<HTMLSpanElement>(null)
  const body = useRef<HTMLSpanElement>(null)
  const fine = useFinePointer()
  const reduced = useReducedMotion()

  useEffect(() => {
    const area = zone.current
    const element = body.current
    if (!fine || reduced || !area || !element) return
    const xTo = gsap.quickTo(element, 'x', { duration: 0.9, ease: 'elastic.out(1, 0.35)' })
    const yTo = gsap.quickTo(element, 'y', { duration: 0.9, ease: 'elastic.out(1, 0.35)' })

    const move = (event: PointerEvent) => {
      const rect = area.getBoundingClientRect()
      xTo((event.clientX - (rect.left + rect.width / 2)) * strength)
      yTo((event.clientY - (rect.top + rect.height / 2)) * strength)
    }
    const leave = () => {
      xTo(0)
      yTo(0)
    }

    area.addEventListener('pointermove', move)
    area.addEventListener('pointerleave', leave)
    return () => {
      area.removeEventListener('pointermove', move)
      area.removeEventListener('pointerleave', leave)
      gsap.set(element, { x: 0, y: 0 })
    }
  }, [fine, reduced, strength])

  return (
    <span ref={zone} className={cn('-m-3 inline-block p-3', className)}>
      <span ref={body} className='inline-block will-change-transform'>
        {children}
      </span>
    </span>
  )
}
