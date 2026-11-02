import { gsap } from 'gsap'
import { type ReactNode, useLayoutEffect, useRef, useState } from 'react'

import { useReducedMotion } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

export type FlapTone = 'blank' | 'paper' | 'ink' | 'seal'

type Face = { word: string; tone: FlapTone }

const TONES: Record<FlapTone, string> = {
  blank: 'bg-[#e7e2d5] text-[#0d0b09]/30',
  paper: 'bg-[#f7f4ec] text-[#0d0b09]',
  ink: 'bg-[#0d0b09] text-[#f2efe6]',
  seal: 'bg-[#f7f4ec] text-[#b3261e]',
}

/** 让一个词刚好装进牌面：汉字按一个字宽、拉丁字母按约三分之二个字宽估算，再受牌面高度限制。 */
function fitSize(word: string) {
  let units = 0
  for (const char of word) units += /[\u3000-\u9fff\uff00-\uffef]/.test(char) ? 1 : char === ' ' ? 0.28 : 0.66
  return `min(60cqh, ${(84 / Math.max(1, units)).toFixed(2)}cqw)`
}

function FaceTile({ face, mark, textClassName }: { face: Face; mark?: string; textClassName?: string }) {
  return (
    <div className={cn('absolute inset-0 grid place-items-center', TONES[face.tone])}>
      {face.tone === 'blank' ? (
        <>
          <span className='absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent_0_7px,rgba(13,11,9,.06)_7px_8px)]' />
          <span className='relative font-mono text-[.6rem] tracking-[.3em]'>{mark}</span>
        </>
      ) : (
        <span
          className={cn('relative leading-none whitespace-nowrap', textClassName)}
          style={{ fontSize: fitSize(face.word) }}
        >
          {face.word}
        </span>
      )}
      {face.tone === 'ink' ? <span className='absolute inset-[6%] border border-[#f2efe6]/12' /> : null}
      {face.tone === 'seal' ? <span className='absolute inset-[6%] border border-[#b3261e]/35' /> : null}
    </div>
  )
}

/** 只露出一半的牌面。 */
function Half({ part, children, className }: { part: 'top' | 'bottom'; children: ReactNode; className?: string }) {
  return (
    <div className={cn('absolute inset-x-0 h-1/2 overflow-hidden', part === 'top' ? 'top-0' : 'bottom-0', className)}>
      <div className={cn('absolute inset-x-0 h-[200%]', part === 'top' ? 'top-0' : 'bottom-0')}>{children}</div>
    </div>
  )
}

/**
 * 机械翻牌：上半片沿中轴翻下，露出新的牌面。flipKey 每变一次就翻一次（同一个字也会再翻）。
 * heavy 时翻得更狠，落定后整块牌在吊线上晃几下。纯装饰，读屏内容由调用方提供。
 */
export function VerdictFlap({
  word,
  tone,
  flipKey,
  heavy,
  mark,
  className,
  textClassName,
}: {
  word: string
  tone: FlapTone
  flipKey: number
  heavy?: boolean
  mark?: string
  className?: string
  textClassName?: string
}) {
  const reduced = useReducedMotion()
  const next: Face = { word, tone }
  const [prev, setPrev] = useState<Face>(next)
  const leaf = useRef<HTMLDivElement>(null)
  const frontShade = useRef<HTMLDivElement>(null)
  const backShade = useRef<HTMLDivElement>(null)
  const hanger = useRef<HTMLDivElement>(null)
  const first = useRef(true)
  const nextRef = useRef(next)
  nextRef.current = next

  // biome-ignore lint/correctness/useExhaustiveDependencies: 只在 flipKey 变化时翻牌
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const element = leaf.current
    if (!element || reduced) {
      setPrev(nextRef.current)
      return
    }
    const duration = heavy ? 0.3 : 0.36
    const timeline = gsap
      .timeline({ onComplete: () => setPrev(nextRef.current) })
      .fromTo(element, { rotationX: 0 }, { rotationX: -180, duration, ease: heavy ? 'power3.in' : 'power2.in' })
      .fromTo(frontShade.current, { opacity: 0 }, { opacity: 0.55, duration: duration / 2, ease: 'none' }, 0)
      .fromTo(backShade.current, { opacity: 0.55 }, { opacity: 0, duration: duration / 2, ease: 'none' }, duration / 2)
    if (hanger.current)
      timeline.fromTo(
        hanger.current,
        { y: heavy ? 10 : 3, rotation: heavy ? 2.4 : 0 },
        { y: 0, rotation: 0, duration: heavy ? 1.1 : 0.4, ease: heavy ? 'elastic.out(1.1, 0.28)' : 'power3.out' },
        duration,
      )
    return () => {
      timeline.kill()
      gsap.set(element, { rotationX: 0 })
    }
  }, [flipKey])

  return (
    <div ref={hanger} className={cn('relative origin-top [container-type:size]', className)}>
      <div className='absolute inset-0 [perspective:900px]'>
        <Half part='top'>
          <FaceTile face={next} mark={mark} textClassName={textClassName} />
        </Half>
        <Half part='bottom'>
          <FaceTile face={prev} mark={mark} textClassName={textClassName} />
        </Half>
        <div ref={leaf} className='absolute inset-x-0 top-0 h-1/2 origin-bottom [transform-style:preserve-3d]'>
          <Half part='top' className='h-full [backface-visibility:hidden]'>
            <FaceTile face={prev} mark={mark} textClassName={textClassName} />
            <div ref={frontShade} className='absolute inset-0 bg-black opacity-0' />
          </Half>
          <div className='absolute inset-0 overflow-hidden [backface-visibility:hidden] [transform:rotateX(180deg)]'>
            <div className='absolute inset-x-0 bottom-0 h-[200%]'>
              <FaceTile face={next} mark={mark} textClassName={textClassName} />
            </div>
            <div ref={backShade} className='absolute inset-0 bg-black opacity-0' />
          </div>
        </div>
        {/* 中轴：一道缝与两侧的销钉 */}
        <span className='absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-black/55 shadow-[0_1px_0_rgba(255,255,255,.25)]' />
        <span className='absolute top-1/2 -left-[3px] size-[6px] -translate-y-1/2 bg-[linear-gradient(135deg,#d9d6cf,#6d6a64)]' />
        <span className='absolute top-1/2 -right-[3px] size-[6px] -translate-y-1/2 bg-[linear-gradient(135deg,#d9d6cf,#6d6a64)]' />
        <span className='pointer-events-none absolute inset-0 border border-[#0d0b09]/25' />
      </div>
    </div>
  )
}

/** 金属横轴与吊线：翻牌挂在它下面。 */
export function FlapAxle({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-x-0 h-[3px]', className)}>
      <span className='absolute inset-0 bg-[linear-gradient(180deg,#f4f2ec_0%,#8b8880_45%,#3b3934_100%)]' />
      <span className='absolute -left-1 top-1/2 size-[9px] -translate-y-1/2 bg-[linear-gradient(135deg,#e2dfd8,#55524c)]' />
      <span className='absolute -right-1 top-1/2 size-[9px] -translate-y-1/2 bg-[linear-gradient(135deg,#e2dfd8,#55524c)]' />
    </div>
  )
}

/** 一块牌上方的两根吊线。 */
export function FlapWires({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('pointer-events-none absolute inset-x-[18%] -top-[var(--wire)] h-[var(--wire)]', className)}
    >
      <span className='absolute top-0 left-0 h-full w-px bg-[#3b3934]/70' />
      <span className='absolute top-0 right-0 h-full w-px bg-[#3b3934]/70' />
    </span>
  )
}
