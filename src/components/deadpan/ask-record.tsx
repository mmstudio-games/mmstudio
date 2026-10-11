import { CornerDownLeft } from 'lucide-react'
import { type CSSProperties, type FormEvent, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Redacted } from '@/components/motion/redacted'
import { TypedText } from '@/components/motion/typed-text'
import { cn } from '@/lib/utils'

type Entry = { id: number; text: string; time: string }

const MAX_ENTRIES = 5

/** 页面设计单位（一页 512 宽）换算成容器宽度的比例，与 book-pages 的坐标一一对应。 */
const u = (value: number) => `calc(var(--u) * ${value})`

function Row({ entry, index }: { entry: Entry; index: number }) {
  const { t } = useTranslation()
  const [peek, setPeek] = useState(false)
  return (
    <li
      className='grid animate-in grid-cols-[auto_1fr] fade-in slide-in-from-bottom-2 duration-500'
      style={{ columnGap: u(10), paddingBlock: u(6), minHeight: u(60), fontSize: u(15) }}
    >
      <span className='font-serif-sc font-bold text-[#842219]'>{t('dp.ask.q')}</span>
      <p className='font-serif-sc leading-[1.45] text-[#17120d]'>
        <TypedText text={entry.text} />
        <span className='ml-2 font-mono tracking-[.14em] text-[#17120d]/45' style={{ fontSize: u(8) }}>
          N°{String(index + 1).padStart(2, '0')} · {entry.time}
        </span>
      </p>
      <span className='font-serif-sc font-bold text-[#17120d]/60'>{t('dp.ask.a')}</span>
      <button
        type='button'
        onPointerEnter={() => setPeek(true)}
        onPointerLeave={() => setPeek(false)}
        onFocus={() => setPeek(true)}
        onBlur={() => setPeek(false)}
        className='w-fit text-left text-[#17120d]/75'
        style={{ fontSize: u(13) }}
      >
        <Redacted revealed={peek} barClassName='bg-[#17120d]'>
          {t('dp.ask.pending')}
        </Redacted>
      </button>
    </li>
  )
}

/**
 * 讯问笔录：叠在书的右页上，访客写下的问题被誊写进笔录，回答栏盖着机密条。
 * 容器宽度就是一页宽；内部尺寸按页面设计单位（512 宽）换算。active 为假时整块不可聚焦。
 */
export function AskRecord({ active }: { active: boolean }) {
  const { t } = useTranslation()
  const [entries, setEntries] = useState<Entry[]>([])
  const [draft, setDraft] = useState('')
  const counter = useRef(0)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const text = draft.trim().slice(0, 80)
    if (!text) return
    const time = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
    counter.current++
    setEntries((list) => [...list, { id: counter.current, text, time }].slice(-MAX_ENTRIES))
    setDraft('')
  }

  return (
    <div
      inert={!active}
      className={cn(
        '@container absolute inset-0 transition-opacity duration-500',
        active ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div className='relative size-full text-[#17120d]' style={{ '--u': 'calc(100cqw / 512)' } as CSSProperties}>
        <div className='absolute overflow-hidden' style={{ left: u(66), top: u(66), width: u(402), height: u(528) }}>
          {entries.length === 0 ? (
            <p
              className='flex size-full items-center justify-center text-center font-serif-sc text-[#17120d]/45'
              style={{ fontSize: u(16) }}
            >
              {t('dp.ask.empty')}
            </p>
          ) : (
            <ol aria-live='polite'>
              {entries.map((entry) => (
                <Row key={entry.id} entry={entry} index={entry.id - 1} />
              ))}
            </ol>
          )}
        </div>
        <form
          onSubmit={submit}
          className='absolute flex items-end'
          style={{ left: u(66), top: u(618), width: u(402), gap: u(10) }}
        >
          <label className='flex flex-1 flex-col' style={{ gap: u(4) }}>
            <span className='font-mono tracking-[.2em] text-[#17120d]/60 uppercase' style={{ fontSize: u(8) }}>
              {t('dp.ask.label')}
            </span>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={80}
              placeholder={t('dp.ask.placeholder')}
              className='w-full border-b border-[#17120d]/60 bg-transparent font-serif-sc text-[#17120d] outline-none placeholder:text-[#17120d]/35 focus:border-[#842219]'
              style={{ fontSize: u(16), paddingBlock: u(4) }}
            />
          </label>
          <button
            type='submit'
            disabled={!draft.trim()}
            className='flex items-center bg-[#17120d] font-semibold tracking-[.14em] text-[#ecdcbc] uppercase transition-colors hover:bg-[#842219] disabled:opacity-40'
            style={{ height: u(32), paddingInline: u(12), gap: u(6), fontSize: u(10) }}
          >
            {t('dp.ask.submit')} <CornerDownLeft aria-hidden style={{ width: u(11), height: u(11) }} />
          </button>
        </form>
      </div>
    </div>
  )
}
