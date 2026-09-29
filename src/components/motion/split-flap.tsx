import { useEffect, useRef, useState } from 'react'

import { useReducedMotion } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

const LATIN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const CJK = '是不无关也否真假汤底面'

function pad(word: string, width: number) {
  const chars = Array.from(word)
  return [...chars, ...Array(Math.max(0, width - chars.length)).fill(' ')]
}

function noise(target: string) {
  if (target === ' ') return Math.random() < 0.5 ? ' ' : LATIN[Math.floor(Math.random() * LATIN.length)]
  const pool = /[㐀-鿿]/.test(target) ? CJK : LATIN
  return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * 机场翻牌板：在视口内时按间隔轮换 words，每块牌先乱翻几次再落定。
 * 纯装饰，对读屏隐藏；调用方需另外以文字列出 words。
 */
export function SplitFlap({
  words,
  interval = 2800,
  onIndexChange,
  className,
  tileClassName,
}: {
  words: readonly string[]
  interval?: number
  onIndexChange?: (index: number) => void
  className?: string
  tileClassName?: string
}) {
  const width = Math.max(...words.map((word) => Array.from(word).length))
  const reduced = useReducedMotion()
  const root = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [tiles, setTiles] = useState(() => pad(words[0], width))
  const [inView, setInView] = useState(false)
  const notify = useRef(onIndexChange)
  notify.current = onIndexChange

  useEffect(() => {
    const element = root.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!inView || reduced) return
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % words.length), interval)
    return () => window.clearInterval(timer)
  }, [inView, reduced, interval, words.length])

  useEffect(() => {
    notify.current?.(index)
    const target = pad(words[index], width)
    if (reduced) {
      setTiles(target)
      return
    }
    const start = performance.now()
    let timer = 0
    const step = () => {
      const elapsed = performance.now() - start
      const next = target.map((char, i) => (elapsed > 220 + i * 90 ? char : noise(char)))
      setTiles(next)
      if (next.some((char, i) => char !== target[i])) timer = window.setTimeout(step, 70)
    }
    step()
    return () => window.clearTimeout(timer)
  }, [index, words, width, reduced])

  return (
    <div ref={root} aria-hidden className={cn('flex gap-[.12em] [perspective:600px]', className)}>
      {tiles.map((char, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: 牌位固定
          key={i}
          className={cn(
            'relative grid h-[1.45em] w-[1.12em] place-items-center overflow-hidden bg-[#1d1b17] text-[#f2efe6] shadow-[inset_0_-.08em_0_rgba(0,0,0,.35)]',
            'after:absolute after:inset-x-0 after:top-1/2 after:h-px after:bg-black/70',
            'transition-opacity duration-300',
            char === ' ' && 'opacity-30',
            tileClassName,
          )}
        >
          {/* biome-ignore lint/suspicious/noArrayIndexKey: 以字符为 key，换字时重建以播放翻牌动画 */}
          <span key={char + i} className='block origin-[50%_100%] animate-flap leading-none'>
            {char === ' ' ? ' ' : char}
          </span>
        </span>
      ))}
    </div>
  )
}
