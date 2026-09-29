import { gsap } from 'gsap'
import { useEffect, useRef, useState } from 'react'

import { useFinePointer, useReducedMotion } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

type CursorState = { kind: 'idle' | 'link' | 'label' | 'hidden'; label?: string }

const INTERACTIVE = '[data-cursor], a, button, [role="button"], label, summary'

function readState(target: EventTarget | null): CursorState {
  const element = target instanceof Element ? target.closest(INTERACTIVE) : null
  if (!element) return { kind: 'idle' }
  const label = element.getAttribute('data-cursor')
  if (label === 'none') return { kind: 'hidden' }
  if (label) return { kind: 'label', label }
  return { kind: 'link' }
}

function Reticle() {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<CursorState>({ kind: 'hidden' })
  const current = useRef(state)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const xTo = gsap.quickTo(element, 'x', { duration: 0.35, ease: 'power3' })
    const yTo = gsap.quickTo(element, 'y', { duration: 0.35, ease: 'power3' })
    let placed = false

    const apply = (next: CursorState) => {
      if (current.current.kind === next.kind && current.current.label === next.label) return
      current.current = next
      setState(next)
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      if (!placed) {
        gsap.set(element, { x: event.clientX, y: event.clientY })
        placed = true
      }
      xTo(event.clientX)
      yTo(event.clientY)
      if (current.current.kind === 'hidden' && readState(event.target).kind !== 'hidden') apply(readState(event.target))
    }
    const over = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') apply(readState(event.target))
    }
    const leave = () => apply({ kind: 'hidden' })

    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerover', over)
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerover', over)
      document.documentElement.removeEventListener('pointerleave', leave)
    }
  }, [])

  const corner = 'absolute size-2 border-current transition-all duration-300 ease-out-expo'

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn('pointer-events-none fixed top-0 left-0 z-[90]', state.kind !== 'label' && 'mix-blend-difference')}
    >
      <div
        className={cn(
          'relative -translate-x-1/2 -translate-y-1/2 transition-[width,height,background-color,opacity] duration-300 ease-out-expo',
          state.kind === 'idle' && 'size-1.5 bg-foreground',
          state.kind === 'link' && 'size-11 text-foreground',
          state.kind === 'label' && 'grid h-9 w-auto place-items-center bg-accent px-3 text-accent-foreground',
          state.kind === 'hidden' && 'size-0 opacity-0',
        )}
      >
        {state.kind === 'link' ? (
          <>
            <span className={cn(corner, 'top-0 left-0 border-t border-l')} />
            <span className={cn(corner, 'top-0 right-0 border-t border-r')} />
            <span className={cn(corner, 'bottom-0 left-0 border-b border-l')} />
            <span className={cn(corner, 'right-0 bottom-0 border-r border-b')} />
            <span className='absolute top-1/2 left-1/2 size-1 -translate-1/2 bg-current' />
          </>
        ) : null}
        {state.kind === 'label' ? (
          <span className='font-mono text-[.62rem] font-semibold tracking-[.18em] whitespace-nowrap uppercase'>
            {state.label}
          </span>
        ) : null}
      </div>
    </div>
  )
}

/** 方形准星光标：跟随指针；悬停链接变成取景框，悬停带 data-cursor 的区域显示朱红标签。仅在精确指针设备上显示。 */
export function CursorFollower() {
  const fine = useFinePointer()
  const reduced = useReducedMotion()
  return fine && !reduced ? <Reticle /> : null
}
