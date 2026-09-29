import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

import { useReducedMotion } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

const LATIN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/+=<>'
const CJK = '案卷证言真意妄问答疑审讯供述线索档密汤底面砚'
const IS_CJK = /[㐀-鿿]/

function randomGlyph(char: string) {
  if (/\s|[·—/.,:：，。、「」]/.test(char)) return char
  const pool = IS_CJK.test(char) ? CJK : LATIN
  return pool[Math.floor(Math.random() * pool.length)]
}

/** 解码文字：进入视口或悬停时逐字乱码后落定。可见层对读屏隐藏，另有 sr-only 原文。 */
export function ScrambleText({
  text,
  className,
  trigger = 'both',
  duration = 0.8,
  hoverGroup,
}: {
  text: string
  className?: string
  trigger?: 'view' | 'hover' | 'both' | 'none'
  duration?: number
  /** 悬停该选择器匹配的最近祖先时也重播，例如整行。 */
  hoverGroup?: string
}) {
  const root = useRef<HTMLSpanElement>(null)
  const visual = useRef<HTMLSpanElement>(null)
  const frame = useRef(0)
  const reduced = useReducedMotion()

  useLayoutEffect(() => {
    if (visual.current) visual.current.textContent = text
  }, [text])

  const run = useCallback(() => {
    const element = visual.current
    if (!element || reduced) return
    const chars = Array.from(text)
    const start = performance.now()
    let lastSwap = 0
    cancelAnimationFrame(frame.current)

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / (duration * 1000))
      if (now - lastSwap > 45 || progress === 1) {
        lastSwap = now
        const settled = Math.floor(progress * chars.length)
        element.textContent = chars.map((char, index) => (index < settled ? char : randomGlyph(char))).join('')
      }
      if (progress < 1) frame.current = requestAnimationFrame(step)
    }
    frame.current = requestAnimationFrame(step)
  }, [text, duration, reduced])

  useEffect(() => {
    const element = root.current
    if (!element || (trigger !== 'view' && trigger !== 'both')) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run()
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [run, trigger])

  useEffect(() => {
    const group = hoverGroup ? root.current?.closest(hoverGroup) : null
    if (!group) return
    group.addEventListener('pointerenter', run)
    return () => group.removeEventListener('pointerenter', run)
  }, [hoverGroup, run])

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  return (
    <span
      ref={root}
      className={cn('inline-block', className)}
      onPointerEnter={trigger === 'hover' || trigger === 'both' ? run : undefined}
    >
      <span ref={visual} aria-hidden />
      <span className='sr-only'>{text}</span>
    </span>
  )
}
