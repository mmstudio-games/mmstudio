import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { useList } from './hgt-kit'
import { ACT_STARTS, ACTS, formatTimecode, onHgtFrame, TOTAL_SCREENS } from './hgt-store'

/**
 * 右侧常驻的胶片齿孔与时间码标尺。白色加差值混合：在纸上显黑，在墨上显白。
 * 四角的等宽暗记也在这里：案号、指针坐标、当前幕。
 */
export function TimecodeRail() {
  const { t } = useTranslation()
  const acts = useList('hgtPage.acts')
  const rail = useRef<HTMLDivElement>(null)
  const code = useRef<HTMLSpanElement>(null)
  const act = useRef<HTMLSpanElement>(null)
  const coords = useRef<HTMLSpanElement>(null)
  const playhead = useRef<HTMLSpanElement>(null)
  const actsRef = useRef(acts)
  actsRef.current = acts

  useEffect(() => {
    let lastShown = -1
    let lastCode = ''
    return onHgtFrame((frame) => {
      const element = rail.current
      if (!element) return
      // 齿孔和刻度随滚动走，像胶片在片门里移动
      element.style.setProperty('--travel', `${(-frame.u * frame.height * 0.5).toFixed(1)}px`)
      const text = formatTimecode(frame.u)
      if (text !== lastCode && code.current) {
        code.current.textContent = text
        lastCode = text
      }
      if (frame.shown !== lastShown && act.current) {
        act.current.textContent = actsRef.current[frame.shown] ?? ''
        lastShown = frame.shown
      }
      if (playhead.current) playhead.current.style.top = `${Math.min(1, frame.u / TOTAL_SCREENS) * 100}%`
    })
  }, [])

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!coords.current) return
      const x = (event.clientX / window.innerWidth).toFixed(3)
      const y = (event.clientY / window.innerHeight).toFixed(3)
      coords.current.textContent = `X ${x} · Y ${y}`
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [])

  const corner = 'absolute font-mono text-[.56rem] tracking-[.22em] whitespace-nowrap uppercase'
  const travel = { backgroundPositionY: 'var(--travel)' }

  return (
    <div aria-hidden className='pointer-events-none absolute inset-0 z-40 text-white mix-blend-difference'>
      {/* 四角暗记 */}
      <span className={`${corner} top-[1.6vh] left-[clamp(.9rem,2.2vw,2rem)] flex flex-col gap-1.5`}>
        <span>{t('hgtPage.case')}</span>
        <span ref={act} className='opacity-60' />
      </span>
      <span ref={coords} className={`${corner} top-[1.6vh] right-[calc(clamp(.9rem,2.2vw,2rem)+2.4rem)] max-md:hidden`}>
        X 0.500 · Y 0.500
      </span>

      {/* 胶片边：刻度、时间码、幕的分界、播放头，最外侧是齿孔 */}
      <div ref={rail} className='absolute inset-y-0 right-0 flex w-[2.4rem] [--travel:0px] max-md:w-[1.5rem]'>
        <div className='relative h-full flex-1'>
          <span
            className='absolute inset-y-0 right-0 w-[5px] opacity-60'
            style={{
              backgroundImage: 'repeating-linear-gradient(180deg, currentColor 0 1px, transparent 1px 6px)',
              ...travel,
            }}
          />
          <span
            className='absolute inset-y-0 right-0 w-[10px] opacity-80'
            style={{
              backgroundImage: 'repeating-linear-gradient(180deg, currentColor 0 1px, transparent 1px 30px)',
              ...travel,
            }}
          />
          <span className='absolute top-[4vh] right-[13px] font-mono text-[.5rem] tracking-[.24em] [writing-mode:vertical-rl] max-md:hidden'>
            {t('hgtPage.rail.fps')}
          </span>
          <span className='absolute right-[13px] bottom-[4vh] font-mono text-[.5rem] tracking-[.24em] [writing-mode:vertical-rl] max-md:hidden'>
            {t('hgtPage.rail.timecode')}
          </span>
          <span
            ref={code}
            className='absolute top-1/2 right-[13px] -translate-y-1/2 font-mono text-[.58rem] font-semibold tracking-[.16em] tabular-nums [writing-mode:vertical-rl] max-md:right-[11px] max-md:text-[.5rem]'
          >
            00:00:00:00
          </span>
          {ACTS.map((item, i) => (
            <span
              key={item.id}
              className='absolute right-0 h-px w-[18px] bg-current'
              style={{ top: `${(ACT_STARTS[i] / TOTAL_SCREENS) * 100}%` }}
            />
          ))}
          <span ref={playhead} className='absolute right-0 h-[3px] w-[24px] -translate-y-1/2 bg-current' />
        </div>
        <span className='flex h-full w-[12px] border-x-2 border-current max-md:w-[9px]'>
          <span
            className='h-full flex-1'
            style={{
              backgroundImage: 'repeating-linear-gradient(180deg, currentColor 0 6px, transparent 6px 15px)',
              ...travel,
            }}
          />
        </span>
      </div>
    </div>
  )
}
