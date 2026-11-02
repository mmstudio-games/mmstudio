import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import { PaperGrid, useList, VERDICT_ORDER, type Verdict } from './hgt-kit'
import { actProgress, onHgtFrame, smooth } from './hgt-store'
import { FlapAxle, FlapWires, VerdictFlap } from './verdict-flap'
import { buildLattice, LATTICE } from './verdict-lattice'

/** 四句示例追问依次撞向审定台，各自得到一种裁决。 */
const BEATS: readonly Verdict[] = ['irrelevant', 'no', 'both', 'yes']
const BEAT_START = 0.06
const BEAT_LENGTH = 0.2
/** 一句追问在它那一段里撞上翻牌的时刻。 */
const IMPACT = 0.55

/** 分岔用实一些的虚线，竖线更淡更疏，免得和翻牌、网格抢眼。 */
const DASH = 'stroke-[#0d0b09]/55 [stroke-dasharray:5_6] [vector-effect:non-scaling-stroke]'
const TAIL = 'stroke-[#0d0b09]/28 [stroke-dasharray:3_8] [vector-effect:non-scaling-stroke]'

/** 第二幕：主持人砚的审定台，四种裁决让发散的猜测逐层坍缩。 */
export function ActVerdict({ index }: { index: number }) {
  const { t } = useTranslation()
  const root = useRef<HTMLDivElement>(null)
  const push = useRef<HTMLDivElement>(null)
  const question = useRef<HTMLDivElement>(null)
  const questionAnchor = useRef<HTMLDivElement>(null)
  const caption = useRef<HTMLParagraphElement>(null)
  const boardsRow = useRef<HTMLDivElement>(null)
  const [hits, setHits] = useState(0)
  const [beat, setBeat] = useState(0)
  const [flips, setFlips] = useState<Record<Verdict, number>>({ yes: 0, no: 0, irrelevant: 0, both: 0 })
  const hitsRef = useRef(0)
  const beatRef = useRef(0)
  const questions = useList('hgtPage.verdict.questions')
  const effects = useList('hgtPage.verdict.effects')
  const lattice = useMemo(() => buildLattice(), [])

  useEffect(() => {
    const element = root.current
    if (!element) return
    return onHgtFrame((frame) => {
      const act = element.closest('[data-act]')
      if (frame.shown !== index && !act?.hasAttribute('data-cut')) return
      const p = actProgress(frame.u, index)
      const raw = (p - BEAT_START) / BEAT_LENGTH
      const current = Math.max(0, Math.min(BEATS.length - 1, Math.floor(raw)))
      const local = Math.max(0, Math.min(1, raw - current))
      const nextHits = Math.max(0, Math.min(BEATS.length, Math.floor(raw - IMPACT) + 1))

      if (current !== beatRef.current) {
        beatRef.current = current
        setBeat(current)
      }
      if (nextHits !== hitsRef.current) {
        const before = hitsRef.current
        hitsRef.current = nextHits
        setHits(nextHits)
        // 每块牌在被点亮和熄灭时各翻一次
        const changed = BEATS.slice(Math.min(before, nextHits), Math.max(before, nextHits))
        setFlips((value) => {
          const next = { ...value }
          for (const verdict of changed) next[verdict] += 1
          return next
        })
      }

      // 追问从底部升起，加速撞向它的那块牌
      const anchor = questionAnchor.current
      const box = question.current
      const row = boardsRow.current
      if (anchor && box && row) {
        const target = row.querySelector<HTMLElement>(`[data-board='${BEATS[current]}']`)
        const rise = smooth(0, 0.14, local)
        const travel = Math.min(1, Math.max(0, (local - 0.18) / (IMPACT - 0.18)))
        const eased = travel * travel * travel
        let dx = 0
        let dy = 0
        if (target && eased > 0) {
          const a = target.getBoundingClientRect()
          const b = anchor.getBoundingClientRect()
          dx = (a.left + a.width / 2 - (b.left + b.width / 2)) * eased
          dy = (a.bottom - (b.top + b.height / 2)) * eased
        }
        const visible = raw >= 0 && raw < BEATS.length && local < IMPACT + 0.02 ? rise : 0
        box.style.transform = `translate3d(${dx}px, ${dy + (1 - rise) * 30}px, 0) scale(${1 - eased * 0.45})`
        box.style.opacity = String(visible)
      }
      const end = smooth(0.88, 0.99, p)
      if (caption.current) caption.current.style.opacity = String(nextHits > 0 ? 1 - end : 0)

      // 幕末：镜头对准正中那条朱红直线，四块牌退暗
      if (push.current) {
        push.current.style.transform = `scale(${1 + end * 0.1})`
        push.current.style.setProperty('--dim', String(1 - end * 0.9))
      }
    })
  }, [index])

  const word = (verdict: Verdict) => t(`hgtPage.verdicts.${verdict}`)
  const lastHit = hits > 0 ? hits - 1 : -1

  return (
    <div ref={root} className='absolute inset-0 overflow-hidden bg-[#f2efe6] text-[#0d0b09] select-none'>
      <div ref={push} data-push className='absolute inset-0 origin-center [--dim:1]'>
        <PaperGrid />

        {/* 发散猜测的虚线网 */}
        <svg
          aria-hidden='true'
          viewBox={`0 0 ${LATTICE.width} ${LATTICE.height}`}
          preserveAspectRatio='xMidYMid slice'
          data-irrelevant={hits >= 1 ? '' : undefined}
          data-no={hits >= 2 ? '' : undefined}
          data-both={hits >= 3 ? '' : undefined}
          data-yes={hits >= 4 ? '' : undefined}
          className='group/lat absolute inset-0 size-full fill-none'
        >
          {lattice.map((path, i) => (
            <path
              // biome-ignore lint/suspicious/noArrayIndexKey: 网是确定性生成的
              key={i}
              d={path.d}
              strokeWidth={1}
              className={cn(
                path.tail && path.part !== 'bent' ? TAIL : DASH,
                'transition-[opacity,translate] duration-500',
                path.group === 'irrelevant' &&
                  'group-data-[irrelevant]/lat:translate-y-3 group-data-[irrelevant]/lat:animate-[hgt-power-off_.6s_steps(1)_forwards]',
                path.part === 'above' && 'group-data-[no]/lat:opacity-0 group-data-[no]/lat:duration-150',
                path.part === 'straight' && 'group-data-[both]/lat:opacity-0',
                path.part === 'bent' && 'opacity-0 group-data-[both]/lat:opacity-100',
                path.group !== 'irrelevant' && 'group-data-[yes]/lat:opacity-25',
                path.part === 'above' && 'group-data-[yes]/lat:opacity-0',
                path.part === 'straight' && 'group-data-[yes]/lat:opacity-0',
              )}
            />
          ))}
          {/* 不是：一道墨色闸门截断左侧 */}
          <rect
            x={LATTICE.width / 3 - 10}
            y={LATTICE.gate - 14}
            width={LATTICE.spine - LATTICE.width / 3 - 14}
            height={22}
            className='origin-left scale-x-0 fill-[#0d0b09] transition-transform duration-300 ease-out [transform-box:fill-box] group-data-[no]/lat:scale-x-100'
          />
          {/* 主干：起初也是一条虚线，答「是」后染成朱红，笔直刺穿画面 */}
          <path d={`M${LATTICE.spine} ${LATTICE.height + 20}V-20`} strokeWidth={1} className={DASH} />
        </svg>
        {/* 主干的那道朱红：画面居中裁切，主干正好在屏幕正中，用一条元素从下往上长出来 */}
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 origin-bottom bg-[#b3261e] transition-transform duration-700 ease-out',
            hits >= 4 ? 'scale-y-100' : 'scale-y-0',
          )}
        />

        {/* 审定席 */}
        <div className='absolute inset-x-0 top-[6vh] flex flex-col items-center gap-2 px-6 text-center'>
          <p className='flex items-center gap-3 font-mono text-[.62rem] tracking-[.3em] uppercase'>
            <span className='size-1.5 bg-[#b3261e]' />
            {t('hgtPage.verdict.seat')}
          </p>
          <p className='font-serif-sc text-[clamp(.85rem,1.2vw,1.1rem)] text-[#0d0b09]/70'>
            {t('hgtPage.verdict.note')}
          </p>
        </div>

        {/* 四座巨型翻牌 */}
        <div className='absolute top-[19vh] left-1/2 w-[min(86vw,82rem)] -translate-x-1/2 [--wire:3vh]'>
          <FlapAxle className='top-0' />
          <div ref={boardsRow} className='grid grid-cols-4 gap-[2.2vw] pt-[calc(var(--wire)+3px)]'>
            {VERDICT_ORDER.map((verdict) => {
              const lit = BEATS.indexOf(verdict) < hits
              return (
                <div key={verdict} className='relative opacity-[var(--dim)] transition-opacity'>
                  <div data-board={verdict} className='relative'>
                    <FlapWires />
                    <VerdictFlap
                      word={word(verdict)}
                      tone={lit ? (verdict === 'yes' ? 'seal' : 'ink') : 'paper'}
                      flipKey={flips[verdict]}
                      heavy={verdict === 'yes' && lit}
                      className='h-[clamp(6rem,33vh,22rem)] w-full max-md:h-[30vw]'
                      textClassName={cn('font-serif-sc font-black', verdict === 'both' && 'tracking-[-.03em]')}
                    />
                  </div>
                  <p
                    className={cn(
                      'mt-3 font-mono text-[.58rem] tracking-[.2em] uppercase transition-colors duration-300',
                      BEATS.indexOf(verdict) === lastHit ? 'text-[#b3261e]' : 'text-[#0d0b09]/45',
                    )}
                  >
                    Q.0{BEATS.indexOf(verdict) + 1} · {word(verdict)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* 正在发问的那一句 */}
        <div ref={questionAnchor} className='absolute inset-x-0 bottom-[13vh] flex justify-center px-6'>
          <div ref={question} className='flex origin-center flex-col items-center gap-2 text-center opacity-0'>
            <span className='font-mono text-[.6rem] tracking-[.3em] text-[#b3261e]'>Q.0{beat + 1}</span>
            <span className='border border-[#0d0b09] bg-[#faf8f2] px-[1.4em] py-[.6em] font-serif-sc text-[clamp(1.1rem,2.4vw,2.2rem)] font-bold shadow-[4px_4px_0_rgba(13,11,9,.18)]'>
              {questions[beat]}
            </span>
          </div>
        </div>

        <p
          ref={caption}
          className='absolute bottom-[6vh] left-1/2 -translate-x-1/2 font-mono text-[.62rem] tracking-[.22em] whitespace-nowrap uppercase opacity-0 transition-opacity duration-300'
        >
          <span className={cn(lastHit === 3 && 'text-[#b3261e]')}>{lastHit >= 0 ? effects[lastHit] : ''}</span>
        </p>
      </div>

      <ol className='sr-only'>
        {questions.map((item, i) => (
          <li key={item}>
            {item} — {word(BEATS[i])}
          </li>
        ))}
      </ol>
    </div>
  )
}
