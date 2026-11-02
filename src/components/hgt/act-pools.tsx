import { gsap } from 'gsap'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useReducedMotion } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

import { PaperGrid, Stars } from './hgt-kit'
import { HGT_DAILY, HGT_LIBRARY, HGT_SNAPSHOT_DATE, type HgtLevel, type HgtLocale } from './hgt-snapshot'
import { actProgress, onActEnter, onHgtFrame, pointer, smooth } from './hgt-store'

type DailyEntry = { date: string; level: HgtLevel | null; locale: HgtLocale | null; today: boolean }

/** 刻度环上的 24 格：最新的一格是今天。快照之后的日子，难度要等开汤后才知道。 */
function buildDaily(today: string): DailyEntry[] {
  const entries: DailyEntry[] = []
  if (HGT_DAILY[0].date < today) entries.push({ date: today, level: null, locale: null, today: true })
  for (const item of HGT_DAILY) {
    if (entries.length >= 24) break
    if (item.date > today) continue
    entries.push({ ...item, today: item.date === today })
  }
  if (!entries.some((entry) => entry.today)) entries[0].today = true
  return entries
}

/** 题库卷宗按新到旧编号。 */
const LIBRARY = HGT_LIBRARY.map((card, i) => ({ ...card, no: HGT_LIBRARY.length - i }))

const SLOT = 15
const ARC = 23 * SLOT

/** 计数器的一位数字：转一整圈后落在原来的数上。 */
function RollingDigits({ value, run, pulse }: { value: number; run: boolean; pulse: number }) {
  const digits = String(value).split('')
  return (
    <span className='inline-flex tabular-nums'>
      {digits.map((digit, i) => {
        const d = Number(digit)
        const row = run ? (pulse % 2 ? 20 : 10) + d : 0
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: 数位固定
          <span key={i} className='inline-block h-[1em] overflow-hidden leading-none'>
            <span
              className='block transition-transform duration-[1400ms] ease-out-expo'
              style={{ transform: `translateY(${-row}em)`, transitionDelay: `${i * 90}ms` }}
            >
              {Array.from({ length: 30 }, (_, k) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: 数字条
                <span key={k} className='block h-[1em]'>
                  {k % 10}
                </span>
              ))}
            </span>
          </span>
        )
      })}
    </span>
  )
}

/** 劈开后的半幅画面：转场三结束后就滑出画外。 */
function SplitHalf({ side }: { side: 'left' | 'right' }) {
  return (
    <div data-split={side} className='relative h-1/2 overflow-hidden bg-[#f2efe6]'>
      <PaperGrid />
      <span
        className={cn('absolute inset-y-0 w-[9px] bg-[#b3261e]', side === 'left' ? 'right-0' : 'left-0')}
        aria-hidden
      />
      <span
        aria-hidden
        className={cn(
          'absolute inset-y-0 w-[6px] bg-[repeating-linear-gradient(180deg,rgba(13,11,9,.4)_0_30px,transparent_30px_72px)]',
          side === 'left' ? 'right-[22%]' : 'left-[31%]',
        )}
      />
    </div>
  )
}

/** 第三幕：双生造局。左轨是官方每日汤的 24 格刻度环，右轨是汤友题库的封存卷宗。 */
export function ActPools({ index }: { index: number }) {
  const { t, i18n } = useTranslation()
  const reduced = useReducedMotion()
  const root = useRef<HTMLDivElement>(null)
  const left = useRef<HTMLDivElement>(null)
  const right = useRef<HTMLDivElement>(null)
  const dial = useRef<SVGGElement>(null)
  const sweep = useRef<SVGLineElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const stack = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const [run, setRun] = useState(false)
  const [pulses, setPulses] = useState<number[]>(() => HGT_LIBRARY.map(() => 0))
  const today = useMemo(() => new Date().toLocaleDateString('sv-SE'), [])
  const daily = useMemo(() => buildDaily(today), [today])
  const zh = i18n.language.startsWith('zh')

  // 两条轨道的终止位置；转场三会从劈开的状态推到这里
  useLayoutEffect(() => {
    gsap.set(left.current, { yPercent: -50 })
    gsap.set(right.current, { yPercent: 0 })
  }, [])

  useEffect(
    () =>
      onActEnter((event) => {
        if (event.index === index) setRun(true)
      }),
    [index],
  )

  // 计数器偶尔跳一下：转一圈，落回同一个数（数字本身是快照，不会变）
  useEffect(() => {
    if (!run || reduced) return
    const timer = window.setInterval(() => {
      const pick = Math.floor(Math.random() * HGT_LIBRARY.length)
      setPulses((value) => value.map((count, i) => (i === pick ? count + 1 : count)))
    }, 2400)
    return () => window.clearInterval(timer)
  }, [run, reduced])

  useEffect(() => {
    const element = root.current
    if (!element) return
    let spin = 0
    let spinVelocity = 0
    return onHgtFrame((frame) => {
      const act = element.closest('[data-act]')
      if (frame.shown !== index && !act?.hasAttribute('data-cut')) return
      const p = actProgress(frame.u, index)
      const { dt, time } = frame

      // 指针扫得越快，钟盘多转一点，随后回正
      if (!reduced) {
        spinVelocity += pointer.vx * dt * 0.02
        spinVelocity *= Math.exp(-dt * 3)
        spin += spinVelocity * dt
        spin *= Math.exp(-dt * 1.6)
        spin = Math.max(-28, Math.min(28, spin))
      }
      const rho = (1 - smooth(0.04, 0.84, p)) * ARC + spin
      dial.current?.setAttribute('transform', `rotate(${rho} 500 500)`)
      sweep.current?.setAttribute('transform', `rotate(${reduced ? 0 : (time * 6) % 360} 500 500)`)
      ring.current?.querySelectorAll<HTMLElement>('[data-pool-card]').forEach((card, i) => {
        let angle = (-i * SLOT + rho) % 360
        if (angle > 180) angle -= 360
        if (angle <= -180) angle += 360
        const fade = 1 - smooth(26, 62, Math.abs(angle))
        card.style.transform = `rotate(${angle}deg) translate(calc(var(--r) + var(--gap)), -50%)`
        card.style.opacity = String(fade)
        // 只写 hidden 或清空，不写 visible：写了 visible 会盖过整幕隐藏时继承下来的 hidden
        card.style.visibility = fade < 0.01 ? 'hidden' : ''
        card.dataset.rot = String(angle)
        card.dataset.live = fade > 0.25 ? '1' : '0'
      })

      // 右轨反向流动：卷宗一张张往下沉
      const flow = smooth(0.02, 0.9, p)
      if (stack.current) stack.current.style.transform = `translate3d(0, ${(flow - 1) * 60}%, 0)`
      if (list.current) list.current.style.transform = `translate3d(0, ${-flow * 60}%, 0)`
    })
  }, [index, reduced])

  const locale = (value: HgtLocale | null) => (value ? t(`hgtPage.pools.locales.${value}`) : '—')

  return (
    <div ref={root} className='absolute inset-0 overflow-hidden bg-[#0d0b09] select-none'>
      {/* 左轨：官方每日汤 */}
      <div ref={left} data-col='left' className='absolute top-0 left-0 h-[200%] w-1/2'>
        <SplitHalf side='left' />
        <div
          className='relative h-1/2 overflow-hidden bg-[#f2efe6] text-[#0d0b09] [--gap:clamp(.6rem,1.4vw,1.4rem)] [--r:min(44vh,30vw)] max-md:[--r:min(30vh,40vw)]'
          data-track='daily'
        >
          <PaperGrid />
          <div className='absolute top-[9vh] right-[clamp(1rem,3vw,3rem)] z-10 max-w-[20rem] bg-[#f2efe6]/85 p-3 text-right shadow-[0_0_24px_12px_rgba(242,239,230,.85)] max-md:top-[7vh] max-md:left-2 max-md:text-left'>
            <p className='font-mono text-[.58rem] tracking-[.26em] text-[#0d0b09]/55 uppercase'>
              {t('hgtPage.pools.dailyLabel')}
            </p>
            <h3
              className={cn(
                'mt-2 font-serif-sc text-[clamp(1.4rem,3.4vw,3.4rem)] leading-none font-black',
                zh && 'whitespace-nowrap',
              )}
            >
              {t('hgtPage.pools.dailyTitle')}
            </h3>
            <p className='mt-3 text-[clamp(.72rem,.95vw,.88rem)] leading-[1.75] text-[#0d0b09]/70 max-md:hidden'>
              {t('hgtPage.pools.dailyBody')}
            </p>
          </div>

          {/* 24 格刻度环 */}
          <div
            ref={ring}
            className='absolute top-1/2 left-[calc(var(--r)*-.3)] size-0 max-md:left-[calc(var(--r)*-.55)]'
          >
            <svg
              aria-hidden='true'
              viewBox='0 0 1000 1000'
              className='absolute top-[calc(var(--r)*-1)] left-[calc(var(--r)*-1)] size-[calc(var(--r)*2)] overflow-visible'
            >
              <g ref={dial}>
                <circle cx='500' cy='500' r='498' className='fill-none stroke-[#0d0b09]' strokeWidth='2' />
                <circle cx='500' cy='500' r='430' className='fill-none stroke-[#0d0b09]/40' strokeWidth='1' />
                <circle cx='500' cy='500' r='250' className='fill-[#ebe7dc] stroke-[#0d0b09]/30' strokeWidth='1' />
                {Array.from({ length: 144 }, (_, k) => {
                  const major = k % 6 === 0
                  const a = (k * 2.5 * Math.PI) / 180
                  const r0 = major ? 452 : 474
                  return (
                    <line
                      // biome-ignore lint/suspicious/noArrayIndexKey: 刻度固定
                      key={k}
                      x1={500 + Math.cos(a) * r0}
                      y1={500 + Math.sin(a) * r0}
                      x2={500 + Math.cos(a) * 496}
                      y2={500 + Math.sin(a) * 496}
                      className='stroke-[#0d0b09]'
                      strokeWidth={major ? 2.4 : 1}
                    />
                  )
                })}
                {Array.from({ length: 24 }, (_, h) => {
                  const a = (h * SLOT * Math.PI) / 180
                  return (
                    <text
                      // biome-ignore lint/suspicious/noArrayIndexKey: 时刻固定
                      key={h}
                      x={500 + Math.cos(a) * 395}
                      y={500 + Math.sin(a) * 395}
                      transform={`rotate(${h * SLOT + 90} ${500 + Math.cos(a) * 395} ${500 + Math.sin(a) * 395})`}
                      textAnchor='middle'
                      dominantBaseline='middle'
                      className='fill-[#0d0b09] font-mono text-[26px]'
                    >
                      {String(h).padStart(2, '0')}
                    </text>
                  )
                })}
                <text x='500' y='478' textAnchor='middle' className='fill-[#0d0b09] font-mono text-[34px] font-bold'>
                  24H
                </text>
                <text
                  x='500'
                  y='528'
                  textAnchor='middle'
                  className='fill-[#0d0b09]/55 font-mono text-[20px] tracking-[4px]'
                >
                  {t('hgtPage.pools.dailyCard')}
                </text>
              </g>
              <line ref={sweep} x1='500' y1='500' x2='500' y2='262' className='stroke-[#b3261e]' strokeWidth='2' />
              <rect x='492' y='492' width='16' height='16' className='fill-[#0d0b09]' />
              {/* 读数线：在三点钟方向 */}
              <line x1='1000' y1='500' x2='1060' y2='500' className='stroke-[#b3261e]' strokeWidth='3' />
              <path d='M1000 500l-22-11v22z' className='fill-[#b3261e]' />
            </svg>

            <div className='max-md:hidden'>
              {daily.map((entry, i) => (
                <div
                  key={entry.date}
                  data-pool-card='daily'
                  className={cn(
                    'absolute top-0 left-0 w-[clamp(11rem,16vw,15.5rem)] origin-[0_50%] border bg-[#faf8f2] px-[.9em] py-[.75em] text-[#0d0b09] shadow-[3px_3px_0_rgba(13,11,9,.12)]',
                    entry.today ? 'border-[#b3261e] border-2' : 'border-[#0d0b09]/50',
                  )}
                  style={{ transform: `rotate(${-i * SLOT}deg) translate(calc(var(--r) + var(--gap)), -50%)` }}
                >
                  <div className='flex items-baseline justify-between gap-3 font-mono'>
                    <span className='text-[clamp(1.1rem,1.7vw,1.6rem)] leading-none font-bold'>
                      No.{entry.date.slice(5).replace('-', '')}
                    </span>
                    <span className='text-[.55rem] tracking-[.14em] text-[#0d0b09]/55'>{entry.date.slice(0, 4)}</span>
                  </div>
                  <div className='mt-2 flex items-center justify-between gap-2 font-mono text-[.56rem] tracking-[.12em] uppercase'>
                    <span className='text-[#0d0b09]/60'>{t('hgtPage.pools.dailyCard')}</span>
                    <span>{locale(entry.locale)}</span>
                  </div>
                  <div className='mt-1.5 flex items-center justify-between gap-2 border-t border-[#0d0b09]/15 pt-1.5 text-[.62rem]'>
                    <span className='text-[#0d0b09]/60'>
                      {entry.level ? t('hgtPage.pools.level') : t('hgtPage.pools.levelSealed')}
                    </span>
                    <Stars level={entry.level} className='text-[.72rem] text-[#b3261e]' />
                  </div>
                  {entry.today ? (
                    <span
                      className={cn(
                        'absolute -top-4 -right-4 grid size-[3.4rem] rotate-[-9deg] place-items-center border-2 border-[#b3261e] bg-[#f2efe6]/90 p-1 text-center leading-tight font-black text-[#b3261e] shadow-[0_0_0_3px_rgba(242,239,230,.8)]',
                        zh ? 'font-serif-sc text-[.72rem]' : 'font-mono text-[.5rem] tracking-[.06em] uppercase',
                      )}
                    >
                      {zh ? (
                        <>
                          今日
                          <br />
                          待破
                        </>
                      ) : (
                        t('hgtPage.pools.today')
                      )}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* 竖屏：刻度环之下列出最近几碗 */}
          <div className='absolute inset-x-3 top-[58%] bottom-0 overflow-hidden md:hidden'>
            <div ref={list} className='flex flex-col gap-2'>
              {daily.slice(0, 12).map((entry) => (
                <div
                  key={entry.date}
                  data-pool-card='daily'
                  className={cn(
                    'relative border bg-[#faf8f2] px-2 py-1.5 font-mono text-[.6rem]',
                    entry.today ? 'border-[#b3261e]' : 'border-[#0d0b09]/40',
                  )}
                >
                  <span className='font-bold'>No.{entry.date.slice(5).replace('-', '')}</span>{' '}
                  <Stars level={entry.level} className='text-[#b3261e]' />
                  {entry.today ? <span className='ml-1 text-[#b3261e]'>· {t('hgtPage.pools.today')}</span> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 右轨：汤友题库 */}
      <div ref={right} data-col='right' className='absolute top-0 right-0 h-[200%] w-1/2'>
        <div className='relative h-1/2 overflow-hidden bg-[#0d0b09] text-[#f2efe6]' data-track='library'>
          <PaperGrid dark />
          <div className='absolute top-[9vh] left-[clamp(1rem,3vw,3rem)] z-10 max-w-[19rem] bg-[#0d0b09]/85 p-3 shadow-[0_0_24px_12px_rgba(13,11,9,.85)] max-md:top-[7vh] max-md:left-2'>
            <p className='font-mono text-[.58rem] tracking-[.26em] text-[#f2efe6]/55 uppercase'>
              {t('hgtPage.pools.libraryLabel')}
            </p>
            <h3
              className={cn(
                'mt-2 font-serif-sc text-[clamp(1.4rem,3.4vw,3.4rem)] leading-none font-black',
                zh && 'whitespace-nowrap',
              )}
            >
              {t('hgtPage.pools.libraryTitle')}
            </h3>
            <p className='mt-3 text-[clamp(.72rem,.95vw,.88rem)] leading-[1.75] text-[#f2efe6]/65 max-md:hidden'>
              {t('hgtPage.pools.libraryBody')}
            </p>
          </div>

          {/* 层叠卷宗：卡面正文被浓墨封存，只露出两个计数 */}
          <div className='absolute top-0 right-[clamp(.75rem,4vw,5rem)] bottom-0 z-0 w-[clamp(8.5rem,27vw,20rem)] max-md:right-3 max-md:w-[calc(100%-1.5rem)]'>
            <div ref={stack} className='absolute inset-x-0 top-[16vh] will-change-transform'>
              {LIBRARY.map((card, i) => {
                // 只有悬停那张左右的几张扇形错开，远处的只让出一点位置
                const fan = hovered === null ? 0 : Math.max(-3, Math.min(3, i - hovered))
                const tilt = ((i * 37) % 7) - 3
                return (
                  <div
                    key={card.no}
                    data-pool-card='library'
                    data-rot={hovered === null ? tilt : fan * 6}
                    onPointerEnter={() => setHovered(i)}
                    onPointerLeave={() => setHovered((value) => (value === i ? null : value))}
                    className='relative mb-[calc(clamp(6rem,15vh,9.5rem)*-0.45)] h-[clamp(6rem,15vh,9.5rem)] origin-[8%_140%] transition-transform duration-500 ease-out-expo'
                    style={{
                      transform:
                        hovered === null
                          ? `rotate(${tilt}deg)`
                          : `translateX(${fan * 10}px) rotate(${fan * 6}deg) translateY(${fan === 0 ? -18 : 0}px)`,
                      zIndex: hovered === i ? 40 : i,
                    }}
                  >
                    <div className='absolute inset-0 bg-[#f2efe6] text-[#0d0b09] shadow-[0_10px_30px_rgba(0,0,0,.45)] [clip-path:polygon(0_0,calc(100%-1.4rem)_0,100%_1.4rem,100%_100%,0_100%)]'>
                      <span className='absolute top-0 right-0 size-[1.4rem] bg-[linear-gradient(225deg,transparent_50%,#cfc9b9_50%)]' />
                      <div className='flex items-baseline justify-between gap-2 py-2 pr-7 pl-3 font-mono text-[clamp(.56rem,.78vw,.72rem)]'>
                        <span className='font-bold tracking-[.12em]'>No.{String(card.no).padStart(3, '0')}</span>
                        <span className='flex items-baseline gap-3 whitespace-nowrap'>
                          <span>
                            <RollingDigits value={card.plays} run={run} pulse={pulses[i]} />{' '}
                            <span className='text-[#0d0b09]/60'>{t('hgtPage.pools.plays')}</span>
                          </span>
                          <span className='max-lg:hidden'>
                            <RollingDigits value={card.solves} run={run} pulse={pulses[i]} />{' '}
                            <span className='text-[#0d0b09]/60'>{t('hgtPage.pools.solves')}</span>
                          </span>
                        </span>
                      </div>
                      <div className='flex items-center justify-between px-3 font-mono text-[.52rem] tracking-[.14em] text-[#0d0b09]/55 uppercase'>
                        <span>{t('hgtPage.pools.libraryCard')}</span>
                        <Stars level={card.level} className='text-[.62rem] text-[#b3261e]' />
                      </div>
                      {/* 墨封：正文封存 */}
                      <div className='absolute inset-x-0 top-[50%] bottom-[12%] bg-[#0d0b09] [filter:url(#hgt-ink-edge)]'>
                        <span className='absolute top-1/2 left-[62%] grid size-[1.6rem] -translate-y-1/2 rotate-[8deg] place-items-center border border-[#b3261e] font-serif-sc text-[.62rem] font-black text-[#b3261e]'>
                          封
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <p className='absolute right-[clamp(1rem,3vw,3rem)] bottom-[3vh] left-[clamp(1rem,3vw,3rem)] font-mono text-[.52rem] leading-relaxed tracking-[.14em] text-[#f2efe6]/45 uppercase'>
            {t('hgtPage.pools.snapshot', { date: HGT_SNAPSHOT_DATE })}
          </p>
        </div>
        <SplitHalf side='right' />
      </div>

      {/* 两轨之间的那道刀口 */}
      <span aria-hidden className='absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[#b3261e]' />

      <div className='sr-only'>
        <h3>{t('hgtPage.pools.dailyTitle')}</h3>
        <p>{t('hgtPage.pools.dailyBody')}</p>
        <ul>
          {daily.slice(0, 7).map((entry) => (
            <li key={entry.date}>
              {entry.date} · {locale(entry.locale)} ·{' '}
              {entry.level ? `${t('hgtPage.pools.level')} ${entry.level}/3` : t('hgtPage.pools.levelSealed')}
              {entry.today ? ` · ${t('hgtPage.pools.today')}` : ''}
            </li>
          ))}
        </ul>
        <h3>{t('hgtPage.pools.libraryTitle')}</h3>
        <p>{t('hgtPage.pools.libraryBody')}</p>
        <p>{t('hgtPage.pools.snapshot', { date: HGT_SNAPSHOT_DATE })}</p>
      </div>
    </div>
  )
}
