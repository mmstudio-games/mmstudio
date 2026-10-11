import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import { getFilmState, measure, SEGMENTS, seekProgress, segmentRanges, subscribeFilm } from './film-store'

/** 影片的名义片长（秒），只用来把进度换算成时间码。 */
const RUNTIME = 250

const timecode = (seconds: number) => {
  const total = Math.round(seconds)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/**
 * 片轴：整页的滚动进度画成一条时间轴。影片段是实块，纸面段是空框；
 * 点击或拖动跳到对应位置，键盘把它当作滑块。
 */
export function FilmScrubber() {
  const { t } = useTranslation()
  const root = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const head = useRef<HTMLDivElement>(null)
  const clock = useRef<HTMLSpanElement>(null)
  const dragging = useRef(false)
  const [ranges, setRanges] = useState(() => segmentRanges())
  const [segment, setSegment] = useState(0)

  // 段落位置随版面高度变化
  useEffect(() => {
    let timer = 0
    const refresh = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        measure()
        setRanges(segmentRanges())
      }, 160)
    }
    const observer = new ResizeObserver(refresh)
    observer.observe(document.body)
    void document.fonts?.ready.then(refresh)
    refresh()
    return () => {
      window.clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  useEffect(
    () =>
      subscribeFilm((state) => {
        if (head.current) head.current.style.left = `${(state.progress * 100).toFixed(3)}%`
        if (clock.current) clock.current.textContent = timecode(state.progress * RUNTIME)
        root.current?.setAttribute('aria-valuenow', String(Math.round(state.progress * 100)))
        root.current?.classList.toggle('translate-y-full', state.overshoot > 40)
        setSegment(state.segment)
      }),
    [],
  )

  const seekAt = (clientX: number, immediate: boolean) => {
    const rect = track.current?.getBoundingClientRect()
    if (!rect) return
    seekProgress((clientX - rect.left) / rect.width, immediate)
  }
  const down = (event: PointerEvent<HTMLDivElement>) => {
    dragging.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    seekAt(event.clientX, false)
  }
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) seekAt(event.clientX, true)
  }
  const up = () => {
    dragging.current = false
  }
  const key = (event: KeyboardEvent<HTMLDivElement>) => {
    const progress = getFilmState().progress
    const step: Record<string, number> = {
      ArrowRight: progress + 0.02,
      ArrowLeft: progress - 0.02,
      PageDown: progress + 0.1,
      PageUp: progress - 0.1,
      Home: 0,
      End: 1,
    }
    if (!(event.key in step)) return
    event.preventDefault()
    seekProgress(step[event.key])
  }

  const current = SEGMENTS[segment]
  return (
    <div
      ref={root}
      role='slider'
      tabIndex={0}
      aria-label={t('dp.film.progress')}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      aria-valuetext={`${current.chapter} ${t(current.label)}`}
      onKeyDown={key}
      className='fixed inset-x-0 bottom-0 z-40 flex h-11 items-center gap-5 border-t border-paper/15 bg-ink px-[clamp(1.25rem,4vw,4.5rem)] font-mono text-[.62rem] tracking-[.18em] text-paper uppercase transition-transform duration-500 ease-out-expo focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-seal'
    >
      <span className='tabular-nums'>
        <span ref={clock}>00:00</span>
        <span className='text-paper/45'> / {timecode(RUNTIME)}</span>
      </span>
      <span className='hidden w-[13rem] truncate md:block'>
        <span className='text-seal'>({current.chapter})</span> {t(current.label)}
        <span className='text-paper/45'> · {t(current.kind === 'reel' ? 'dp.film.reel' : 'dp.film.sheet')}</span>
      </span>
      {/* 指针拖动只是滑块的附加操作，键盘操作在外层 */}
      <div
        ref={track}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className='relative h-full flex-1 cursor-pointer touch-none'
      >
        {ranges.map((range, index) => (
          <div
            key={range.id}
            aria-hidden
            className={cn(
              'absolute top-1/2 h-[9px] -translate-y-1/2',
              range.kind === 'reel' ? 'bg-paper/80' : 'border border-paper/45',
              index === segment && range.kind === 'reel' && 'bg-paper',
              index === segment && range.kind === 'paper' && 'border-paper',
            )}
            style={{ left: `${range.from * 100}%`, width: `calc(${(range.to - range.from) * 100}% - 3px)` }}
          >
            {(index === 0 || ranges[index - 1].chapter !== range.chapter) && (
              <span className='absolute -top-[13px] left-0 text-[.5rem] leading-none text-paper/60'>
                {range.chapter}
              </span>
            )}
          </div>
        ))}
        <div ref={head} aria-hidden className='absolute top-1.5 bottom-1.5 w-px bg-seal'>
          <span className='absolute -top-0.5 left-1/2 size-[7px] -translate-x-1/2 bg-seal' />
        </div>
      </div>
    </div>
  )
}
