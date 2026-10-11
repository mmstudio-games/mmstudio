import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import { CASE_ARCHIVE } from '../case-archive'
import { hasDraft } from '../case-drafts'
import { FilmSection } from './film-section'
import { filmEngine, seekReel } from './film-store'
import { ChapterColumn, MARGIN, NoteColumn, PlateCaption, RunningHead } from './paper-kit'

/**
 * 01 开卷 · 卷宗架：镜头沿架横移。架上灯下那一层是编辑部卷宗，悬停抽出、点击开卷。
 * 画面里的卷脊由引擎做命中检测；这里负责案名牌、点击与键盘可达的列表。
 */
export function ReelStacks({ ready, onOpen }: { ready: boolean; onOpen: (index: number) => void }) {
  const { t } = useTranslation()
  const tag = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const [focused, setFocused] = useState<number | null>(null)
  const shown = hovered ?? focused
  const current = useRef(shown)
  current.current = shown

  // 引擎在父组件的副作用里创建，就绪后再订阅
  useEffect(() => {
    const engine = filmEngine.current
    if (!ready || !engine) return
    const offHover = engine.onHover(setHovered)
    // 案名牌贴着卷脊顶端
    const offFrame = engine.onFrame(() => {
      const element = tag.current
      if (!element) return
      const anchor = current.current === null ? null : engine.spineAnchor(current.current)
      element.style.opacity = anchor ? '1' : '0'
      if (anchor) element.style.transform = `translate3d(${anchor.x}px, ${anchor.y}px, 0)`
    })
    return () => {
      offHover()
      offFrame()
    }
  }, [ready])

  // biome-ignore lint/correctness/useExhaustiveDependencies: shown 变化时让引擎补一帧，刷新案名牌的位置
  useEffect(() => {
    filmEngine.current?.invalidate()
  }, [shown])

  const item = shown === null ? null : CASE_ARCHIVE[shown]
  return (
    <FilmSection
      id='stacks'
      label={`01 ${t('dp.film.stacks')}`}
      paper={
        <>
          <RunningHead chapter='01' name={`${t('dp.chapters.open')} · ${t('dp.film.stacks')}`} page={2} />
          <ChapterColumn chapter='01' name={t('dp.film.stacks')} />
          <NoteColumn>
            <p>{t('dp.film.stacksHint')}</p>
          </NoteColumn>
          <PlateCaption caption={t('dp.film.captionStacks')} />
        </>
      }
    >
      {/* 整块图版可点：指针落在卷脊上时开卷 */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: 键盘用户走下面的列表 */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: 同上 */}
      <div
        className={cn('absolute inset-0', hovered !== null && 'cursor-pointer')}
        data-cursor={hovered !== null ? t('dp.catalog.open') : undefined}
        onClick={() => {
          const index = filmEngine.current?.hovered
          if (index !== null && index !== undefined) onOpen(index)
        }}
      />

      <div
        className={cn('pointer-events-none absolute inset-x-0 bottom-[9vh] flex items-end justify-between', MARGIN)}
        style={{ opacity: 'clamp(0, calc((var(--open) - .85) * 8), 1)' }}
      >
        <p className='bg-[#120d09] px-4 py-3 font-mono text-[.66rem] leading-loose tracking-[.24em] uppercase'>
          <span className='text-accent'>(01)</span> {t('dp.chapters.open')} — {t('dp.film.stacks')}
          <br />
          {t('dp.film.stacksCount', { count: CASE_ARCHIVE.length })}
        </p>
        <p className='bg-[#120d09] px-4 py-3 font-serif-sc text-[clamp(1rem,1.6cqw,1.6rem)] font-bold'>
          {t('dp.film.stacksHint')}
        </p>
      </div>

      {/* 键盘与读屏：真实的案卷列表，聚焦时镜头移到那一卷面前 */}
      <ul className='sr-only' aria-label={t('dp.film.stacksList')}>
        {CASE_ARCHIVE.map((entry, index) => (
          <li key={entry.url}>
            <button
              type='button'
              data-case-index={index}
              onFocus={(event) => {
                setFocused(index)
                const engine = filmEngine.current
                engine?.focusSpine(index)
                // 键盘走到这一宗时镜头才移过去；合上卷宗夹后焦点回来不挪动画面
                if (engine && event.currentTarget.matches(':focus-visible')) {
                  seekReel('stacks', engine.spineProgress(index))
                }
              }}
              onBlur={() => {
                setFocused(null)
                filmEngine.current?.focusSpine(null)
              }}
              onClick={() => onOpen(index)}
            >
              {entry.caseNo} {entry.name}
            </button>
          </li>
        ))}
      </ul>

      {/* 案名牌：位置由引擎每帧写入（图版框内的坐标） */}
      <div
        ref={tag}
        aria-hidden
        className='pointer-events-none absolute top-0 left-0 z-30 opacity-0 transition-opacity duration-200'
      >
        {item && (
          <div className='w-max max-w-[22rem] -translate-x-1/2 -translate-y-[calc(100%+1.4rem)] border border-ink bg-paper px-4 py-3 text-ink shadow-[6px_6px_0_rgba(23,18,13,.9)]'>
            <p className='font-mono text-[.56rem] tracking-[.2em] text-seal uppercase'>{item.caseNo}</p>
            <p className='mt-1 font-serif-sc text-[1.3rem] leading-tight font-black'>{item.name}</p>
            <p className='mt-2 font-mono text-[.56rem] tracking-[.18em] uppercase'>
              {t(`dp.types.${item.type}`)} · {t(`dp.levels.${item.level}`)} ·{' '}
              {t(item.edition === 'zh' ? 'dp.catalog.editionZh' : 'dp.catalog.editionEn')}
            </p>
            {hasDraft(item.caseNo) && (
              <p className='mt-2 flex items-center gap-2 border-t border-ink/30 pt-2 font-serif-sc text-[.74rem] font-bold text-seal'>
                <span aria-hidden className='size-1.5 bg-seal' />
                {t('dp.draft.filed')}
              </p>
            )}
            <span aria-hidden className='absolute -bottom-[1.4rem] left-1/2 h-[1.4rem] w-px bg-paper' />
          </div>
        )}
      </div>
    </FilmSection>
  )
}
