import { gsap } from 'gsap'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useReducedMotion } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { PaperGrid, useList, VERDICT_ORDER, type Verdict } from './hgt-kit'
import { onHgtFrame } from './hgt-store'
import { CRACK, createInkBlob, type InkBlob } from './ink-blob'
import { FlapAxle, FlapWires, VerdictFlap } from './verdict-flap'

/** 五枚追问各自会得到的裁决：两枚偏题、一枚擦边、两枚直击核心。 */
const CHIP_VERDICTS: readonly Verdict[] = ['irrelevant', 'no', 'both', 'yes', 'yes']
const CHIP_TILT = ['-rotate-3', 'rotate-2', '-rotate-1', 'rotate-[2.5deg]', '-rotate-2']
const CHIP_DROP = ['translate-y-0', 'translate-y-2', '-translate-y-1.5', 'translate-y-2.5', '-translate-y-1']

type ChipState = 'idle' | 'flying' | 'struck' | 'gone' | 'edge' | 'core'
type Boards = Record<Verdict, { flips: number; count: number }>

const EMPTY_BOARDS: Boards = {
  yes: { flips: 0, count: 0 },
  no: { flips: 0, count: 0 },
  irrelevant: { flips: 0, count: 0 },
  both: { flips: 0, count: 0 },
}

/** 词片被划穿后化作灰点散去。 */
function dissolve(host: HTMLElement, chip: HTMLElement) {
  const a = chip.getBoundingClientRect()
  const b = host.getBoundingClientRect()
  for (let i = 0; i < 42; i++) {
    const dot = document.createElement('span')
    const size = 2 + Math.random() * 3
    Object.assign(dot.style, {
      position: 'absolute',
      left: `${a.left - b.left + Math.random() * a.width}px`,
      top: `${a.top - b.top + Math.random() * a.height}px`,
      width: `${size}px`,
      height: `${size}px`,
      background: `rgba(13,11,9,${0.25 + Math.random() * 0.35})`,
      pointerEvents: 'none',
      zIndex: '20',
    })
    host.appendChild(dot)
    gsap.to(dot, {
      x: (Math.random() - 0.5) * 120,
      y: -20 - Math.random() * 70,
      opacity: 0,
      duration: 0.9 + Math.random() * 0.8,
      ease: 'power2.out',
      delay: Math.random() * 0.2,
      onComplete: () => dot.remove(),
    })
  }
}

/** 第 0 幕：开场小解谜「破汤入局」。门打开（问中两次「是」）之前，滚动是锁住的。 */
export function ActGate({ index, onSolved, onSkip }: { index: number; onSolved: () => void; onSkip: () => void }) {
  const { t } = useTranslation()
  const reduced = useReducedMotion()
  const root = useRef<HTMLDivElement>(null)
  const pool = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const blob = useRef<InkBlob | null>(null)
  const dirty = useRef(true)
  const [webgl, setWebgl] = useState(true)
  const [boards, setBoards] = useState<Boards>(EMPTY_BOARDS)
  const [chips, setChips] = useState<ChipState[]>(() => CHIP_VERDICTS.map(() => 'idle'))
  const [cracked, setCracked] = useState(false)
  const [ruling, setRuling] = useState('')
  const busy = useRef(false)
  const yesCount = useRef(0)
  const chipLabels = useList('hgtPage.gate.chips')
  const verdictWord = (verdict: Verdict) => t(`hgtPage.verdicts.${verdict}`)

  // 墨团：只在这一幕在画面上时出帧
  useEffect(() => {
    const element = canvas.current
    if (!element) return
    try {
      blob.current = createInkBlob(element)
    } catch {
      setWebgl(false)
      return
    }
    const off = onHgtFrame((frame) => {
      const act = element.closest('[data-act]')
      if (frame.shown !== index && !act?.hasAttribute('data-cut')) return
      if (reduced) {
        if (!dirty.current) return
        dirty.current = false
        blob.current?.render(4, 10)
        return
      }
      blob.current?.render(frame.time, frame.dt)
    })
    const resize = new ResizeObserver(() => {
      dirty.current = true
    })
    resize.observe(element)
    return () => {
      off()
      resize.disconnect()
      blob.current?.dispose()
      blob.current = null
    }
  }, [index, reduced])

  // 裂缝里那行红字顺着裂缝的方向摆
  useLayoutEffect(() => {
    const element = pool.current
    if (!element) return
    const place = () => {
      const { width, height } = element.getBoundingClientRect()
      const dx = (CRACK.b[0] - CRACK.a[0]) * width
      const dy = (CRACK.a[1] - CRACK.b[1]) * height
      element.style.setProperty('--crack-rot', `${(Math.atan2(dy, dx) * 180) / Math.PI - 90}deg`)
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const setChip = (chip: number, state: ChipState) =>
    setChips((list) => list.map((value, i) => (i === chip ? state : value)))

  const rule = (chip: number, verdict: Verdict, element: HTMLElement) => {
    setBoards((value) => ({
      ...value,
      [verdict]: { flips: value[verdict].flips + 1, count: value[verdict].count + 1 },
    }))
    setRuling(t('hgtPage.gate.ruling', { verdict: verdictWord(verdict) }))
    const host = root.current
    const after = reduced ? 0 : 380
    window.setTimeout(() => {
      if (verdict === 'irrelevant' || verdict === 'no') {
        setChip(chip, 'struck')
        window.setTimeout(
          () => {
            if (host && !reduced) dissolve(host, element)
            setChip(chip, 'gone')
          },
          reduced ? 0 : 420,
        )
      } else if (verdict === 'both') {
        setChip(chip, 'edge')
        setCracked(true)
        dirty.current = true
        blob.current?.churn()
        blob.current?.crack()
      } else {
        setChip(chip, 'core')
        dirty.current = true
        blob.current?.slam()
        if (!reduced && pool.current)
          gsap.fromTo(pool.current, { x: -9 }, { x: 0, duration: 0.7, ease: 'elastic.out(1, 0.25)' })
        yesCount.current += 1
        if (yesCount.current === 2) window.setTimeout(onSolved, reduced ? 200 : 700)
      }
      busy.current = false
    }, after)
  }

  const ask = (chip: number, element: HTMLButtonElement) => {
    if (busy.current || chips[chip] !== 'idle') return
    busy.current = true
    const verdict = CHIP_VERDICTS[chip]
    const host = root.current
    const board = host?.querySelector<HTMLElement>(`[data-board='${verdict}']`)
    if (reduced || !host || !board) {
      rule(chip, verdict, element)
      return
    }
    setChip(chip, 'flying')
    const a = element.getBoundingClientRect()
    const b = board.getBoundingClientRect()
    const h = host.getBoundingClientRect()
    const ghost = element.cloneNode(true) as HTMLElement
    ghost.setAttribute('aria-hidden', 'true')
    ghost.tabIndex = -1
    Object.assign(ghost.style, {
      position: 'absolute',
      left: `${a.left - h.left}px`,
      top: `${a.top - h.top}px`,
      width: `${a.width}px`,
      height: `${a.height}px`,
      margin: '0',
      translate: 'none',
      rotate: 'none',
      opacity: '1',
      pointerEvents: 'none',
      zIndex: '30',
    })
    host.appendChild(ghost)
    gsap.to(ghost, {
      x: b.left + b.width / 2 - (a.left + a.width / 2),
      y: b.top + b.height / 2 - (a.top + a.height / 2),
      scale: 0.32,
      rotation: gsap.utils.random(-16, 16),
      duration: 0.5,
      ease: 'power3.in',
      onComplete: () => {
        ghost.remove()
        setChip(chip, 'idle')
        rule(chip, verdict, element)
      },
    })
  }

  const askedCount = chips.filter((state) => state !== 'idle' && state !== 'flying').length
  const yes = boards.yes.count

  return (
    <div ref={root} className='absolute inset-0 overflow-hidden bg-[#f2efe6] text-[#0d0b09] select-none'>
      <PaperGrid />

      {/* 审定席：四块翻牌挂在金属轴下 */}
      <div className='absolute inset-x-0 top-[6.5vh] flex flex-col items-center'>
        <p className='flex items-center gap-3 font-mono text-[.6rem] tracking-[.3em] uppercase'>
          <span className='size-1.5 bg-[#b3261e]' />
          {t('hgtPage.gate.seat')} · {t('hgtPage.gate.host')}
        </p>
        <div className='relative mt-[2.2vh] w-[min(52rem,88vw)] [--wire:1.5vh]'>
          <FlapAxle className='top-0' />
          <div className='grid grid-cols-4 gap-[clamp(.4rem,1.4vw,1.4rem)] pt-[calc(var(--wire)+3px)]'>
            {VERDICT_ORDER.map((verdict, i) => {
              const board = boards[verdict]
              const open = board.count > 0
              return (
                <div key={verdict} className='flex flex-col items-center gap-[.8vh]'>
                  <div data-board={verdict} className='relative w-full'>
                    <FlapWires />
                    <VerdictFlap
                      word={verdictWord(verdict)}
                      tone={open ? (verdict === 'yes' ? 'seal' : 'ink') : 'blank'}
                      flipKey={board.flips}
                      heavy={verdict === 'yes'}
                      mark={String.fromCharCode(65 + i)}
                      className='h-[clamp(3.6rem,13vh,8.4rem)] w-full'
                      textClassName={cn('font-serif-sc font-black', verdict === 'both' && 'tracking-[-.02em]')}
                    />
                  </div>
                  <span className='font-mono text-[.56rem] tracking-[.2em] text-[#0d0b09]/55 uppercase'>
                    {open ? `${verdictWord(verdict)} ×${board.count}` : `${String.fromCharCode(65 + i)} · —`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 墨团与汤面 */}
      <div
        ref={pool}
        className='absolute top-[55%] left-1/2 h-[46vh] w-[88vw] max-w-[1100px] -translate-x-1/2 -translate-y-1/2'
      >
        {/* 裂缝底下的红字：只在裂开后露出沿裂缝的一窄条 */}
        <p
          aria-hidden
          className={cn(
            'absolute top-[55%] left-[74.5%] -translate-1/2 font-serif-sc text-[clamp(1rem,1.5vw,1.45rem)] font-black tracking-[.14em] whitespace-nowrap text-[#b3261e] transition-opacity delay-300 duration-700 [writing-mode:vertical-rl]',
            '[mask-image:linear-gradient(90deg,transparent_22%,#000_44%,#000_56%,transparent_78%)]',
            webgl && cracked ? 'opacity-100' : 'opacity-0',
          )}
          style={{ rotate: 'var(--crack-rot)' }}
        >
          {t('hgtPage.gate.crack')}
        </p>
        <canvas ref={canvas} aria-hidden className={cn('absolute inset-0 size-full', !webgl && 'hidden')} />
        {webgl ? null : (
          <div
            aria-hidden
            className='absolute inset-[6%] bg-[radial-gradient(ellipse_at_center,#0d0b09_0%,#0d0b09_52%,rgba(13,11,9,.6)_62%,transparent_72%)]'
          >
            {cracked ? (
              <span className='absolute top-[20%] left-[70%] h-[60%] w-[3px] rotate-[12deg] bg-[#b3261e]' />
            ) : null}
          </div>
        )}
        <div className='absolute inset-0 flex flex-col items-center justify-center px-[13%] text-center text-[#f2efe6] mix-blend-difference'>
          <p className='mb-[2.4vh] font-mono text-[.6rem] tracking-[.3em] uppercase opacity-70'>
            {t('hgtPage.gate.riddleLabel')}
          </p>
          <p className='max-w-[38rem] font-serif-sc text-[clamp(.98rem,1.7vw,1.6rem)] leading-[1.8] font-semibold text-balance'>
            {t('hgtPage.gate.riddle')}
          </p>
        </div>
      </div>

      {/* 追问词片 */}
      <div className='absolute inset-x-0 bottom-[7.5vh] flex flex-col items-center gap-[1.6vh] px-[5vw]'>
        <p className='font-mono text-[.58rem] tracking-[.3em] text-[#0d0b09]/55 uppercase'>
          {t('hgtPage.gate.chipsLabel')}
        </p>
        <ul className='flex max-w-[64rem] flex-wrap justify-center gap-x-[clamp(.5rem,1.3vw,1.4rem)] gap-y-[1.2vh]'>
          {chipLabels.map((label, chip) => {
            const state = chips[chip]
            return (
              <li key={label} className={cn(CHIP_TILT[chip], CHIP_DROP[chip])}>
                <button
                  type='button'
                  disabled={state !== 'idle'}
                  data-cursor={state === 'idle' ? t('hgtPage.gate.cursor') : undefined}
                  onClick={(event) => ask(chip, event.currentTarget)}
                  className={cn(
                    'group relative flex items-baseline gap-2.5 border border-[#0d0b09]/45 bg-[#faf8f2] px-[clamp(.6rem,1.1vw,1.1rem)] py-[clamp(.4rem,.9vh,.7rem)] text-left shadow-[2px_2px_0_rgba(13,11,9,.14)] transition-[translate,opacity,border-color,box-shadow] duration-500 ease-out-expo',
                    state === 'idle' &&
                      'hover:-translate-y-1 hover:border-[#0d0b09] hover:shadow-[3px_5px_0_rgba(13,11,9,.2)]',
                    state === 'flying' && 'opacity-20',
                    state === 'gone' && 'pointer-events-none opacity-0',
                    state === 'edge' && 'border-dashed opacity-70',
                    state === 'core' && 'border-[#b3261e] shadow-[2px_2px_0_rgba(179,38,30,.35)]',
                    'disabled:cursor-default',
                  )}
                >
                  <span className='font-mono text-[.56rem] text-[#0d0b09]/50'>Q.0{chip + 1}</span>
                  <span className='font-serif-sc text-[clamp(.82rem,1.15vw,1.08rem)] font-semibold'>{label}</span>
                  <span
                    aria-hidden
                    className={cn(
                      'absolute top-1/2 -right-[3%] -left-[3%] h-[3px] origin-left -rotate-2 bg-[#0d0b09] transition-transform duration-400 ease-out-expo',
                      state === 'struck' || state === 'gone' ? 'scale-x-100' : 'scale-x-0',
                    )}
                  />
                  {state === 'edge' ? (
                    <span className='absolute -top-3 -right-2 bg-[#0d0b09] px-1.5 py-0.5 font-serif-sc text-[.62rem] font-bold text-[#f2efe6]'>
                      {verdictWord('both')}
                    </span>
                  ) : null}
                  {state === 'core' ? (
                    <span className='absolute -top-4 -right-3 grid size-9 rotate-[-10deg] place-items-center border-2 border-[#b3261e] bg-[#f2efe6] font-serif-sc text-[1.05rem] font-black text-[#b3261e] animate-in fade-in zoom-in-150 duration-300'>
                      {verdictWord('yes')}
                    </span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* 底边：进度与跳过 */}
      <div className='absolute inset-x-0 bottom-[2.2vh] flex items-center justify-between gap-4 px-[clamp(1rem,3vw,3rem)] pr-[calc(clamp(1rem,3vw,3rem)+2.75rem)] font-mono text-[.58rem] tracking-[.18em] text-[#0d0b09]/60 uppercase'>
        <span className='hidden md:inline'>{t('hgtPage.gate.hint')}</span>
        <span className='flex items-center gap-4'>
          <span>{t('hgtPage.gate.asked', { count: askedCount })}</span>
          <span className={cn(yes > 0 && 'text-[#b3261e]')}>{t('hgtPage.gate.yes', { count: yes })}</span>
        </span>
        <button
          type='button'
          onClick={onSkip}
          className='border-b border-[#0d0b09]/30 pb-0.5 transition-colors hover:border-[#0d0b09] hover:text-[#0d0b09]'
        >
          {t('hgtPage.gate.skip')} →
        </button>
      </div>

      <p className='sr-only' aria-live='polite'>
        {ruling}
      </p>
    </div>
  )
}
