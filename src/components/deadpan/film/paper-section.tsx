import { type ReactNode, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import { registerSegment, type SegmentId, unregisterSegment } from './film-store'
import { MARGIN, NEWSPRINT } from './paper-kit'

/** 纸面段：新闻纸底、墨色字，正常随页面滚动。 */
export function PaperSection({
  id,
  label,
  className,
  children,
}: {
  id: SegmentId
  label: string
  className?: string
  children: ReactNode
}) {
  const section = useRef<HTMLElement>(null)
  useEffect(() => {
    registerSegment(id, section.current)
    return () => unregisterSegment(id)
  }, [id])

  return (
    <section
      ref={section}
      aria-label={label}
      className={cn('relative min-h-[180vh] overflow-x-clip text-ink', MARGIN, className)}
      style={NEWSPRINT}
    >
      {children}
    </section>
  )
}

/** 纸面上的章节抬头：朱红章节号、巨字章节名、右侧一行小字。 */
export function ChapterHead({ chapter, name, note }: { chapter: string; name: string; note?: ReactNode }) {
  const { i18n } = useTranslation()
  const zh = i18n.language.startsWith('zh')
  return (
    <header className='flex items-end justify-between gap-8 border-b-2 border-ink pb-[2.4vh]'>
      <h2 className='flex items-baseline gap-[1.6vw] font-serif-sc leading-[.9] font-black'>
        <span className='font-heading text-[clamp(1.6rem,3.4vw,3.6rem)] text-seal'>{chapter}</span>
        <span
          className={cn('tracking-[-.02em]', zh ? 'text-[clamp(3.6rem,12vw,13rem)]' : 'text-[clamp(3rem,7.4vw,8rem)]')}
        >
          {name}
        </span>
      </h2>
      {note && (
        <div className='max-w-[24rem] pb-[1vh] text-right font-serif-sc text-[.95rem] leading-[1.9]'>{note}</div>
      )}
    </header>
  )
}
