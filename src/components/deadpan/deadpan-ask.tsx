import { ArrowUpRight, CornerDownLeft } from 'lucide-react'
import { type FormEvent, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Magnetic } from '@/components/motion/magnetic'
import { Redacted } from '@/components/motion/redacted'
import { TypedText } from '@/components/motion/typed-text'
import { SectionLabel } from '@/components/site/section-label'
import { Button } from '@/components/ui/button'
import { DEADPAN_URL } from '@/i18n'

import { PAPER_STYLE } from './deadpan-hero'

type Entry = { id: number; text: string; time: string }

const MAX_ENTRIES = 5

function RecordEntry({ entry, index }: { entry: Entry; index: number }) {
  const { t } = useTranslation()
  const [peek, setPeek] = useState(false)

  return (
    <li className='grid grid-cols-[2.5rem_1fr] gap-x-3 gap-y-2 border-b border-[#17120d]/20 py-4 animate-in fade-in slide-in-from-bottom-2 duration-500'>
      <span className='font-serif-sc font-bold text-[#842219]'>{t('dp.ask.q')}</span>
      <p className='font-serif-sc text-[1.05rem] leading-[1.6]'>
        <TypedText text={entry.text} />
        <span className='ml-2 font-mono text-[.6rem] tracking-[.14em] text-[#17120d]/45'>
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
        className='w-fit text-left text-[.9rem] text-[#17120d]/75'
      >
        <Redacted revealed={peek} barClassName='bg-[#17120d]'>
          {t('dp.ask.pending')}
        </Redacted>
      </button>
    </li>
  )
}

/** 盘问：访客写下的问题被誊写进讯问笔录；回答栏盖着机密条，回答在游戏里。 */
export function DeadpanAsk() {
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
    <section
      aria-labelledby='dp-ask-title'
      className='grid gap-14 bg-[#15100b] px-[clamp(1.25rem,4vw,4.5rem)] py-[clamp(6rem,11vw,10rem)] lg:grid-cols-[1fr_minmax(0,40rem)] lg:gap-[6vw]'
    >
      <div className='flex flex-col gap-10'>
        <SectionLabel index='02' label={`${t('dp.chapters.ask')} / ${t('deadpan.meta1')}`} />
        <h2
          id='dp-ask-title'
          className='font-serif-sc text-[clamp(2.8rem,5.6vw,5.4rem)] leading-[1.05] font-black tracking-[.02em] text-balance'
        >
          {t('pillars.oneTitle')}
        </h2>
        <p className='max-w-[30rem] text-[1.05rem] leading-[1.85] text-muted-foreground'>{t('pillars.oneBody')}</p>
        <Magnetic className='w-fit'>
          <Button
            size='lg'
            nativeButton={false}
            className='bg-[#ecdcbc] text-[#17120d] hover:bg-accent hover:text-accent-foreground'
            render={<a href={DEADPAN_URL} target='_blank' rel='noreferrer' />}
          >
            {t('deadpan.play')} <ArrowUpRight data-icon='inline-end' />
          </Button>
        </Magnetic>
      </div>

      <div
        className='relative flex min-h-[560px] flex-col p-[clamp(1.25rem,3vw,2.5rem)] text-[#17120d] shadow-[0_30px_70px_rgba(0,0,0,.5)] lg:rotate-[1deg]'
        style={PAPER_STYLE}
      >
        <div className='flex items-center justify-between border-b-[3px] border-double border-[#17120d] pb-3 font-mono text-[.6rem] tracking-[.2em] uppercase'>
          <span className='font-serif-sc text-[.95rem] font-bold tracking-[.3em]'>{t('dp.ask.record')}</span>
          <span>CASE FILE 001</span>
        </div>
        {entries.length === 0 ? (
          <p className='flex flex-1 items-center justify-center py-10 text-center font-serif-sc text-[#17120d]/45'>
            {t('dp.ask.empty')}
          </p>
        ) : (
          <ol className='flex-1' aria-live='polite'>
            {entries.map((entry) => (
              <RecordEntry key={entry.id} entry={entry} index={entry.id - 1} />
            ))}
          </ol>
        )}
        <form
          onSubmit={submit}
          className='mt-6 flex items-end gap-3 border-t-[3px] border-double border-[#17120d] pt-5'
        >
          <label className='flex flex-1 flex-col gap-2'>
            <span className='font-mono text-[.6rem] tracking-[.2em] text-[#17120d]/60 uppercase'>
              {t('dp.ask.label')}
            </span>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={80}
              placeholder={t('dp.ask.placeholder')}
              className='w-full border-b border-[#17120d]/60 bg-transparent py-2 font-serif-sc text-[1.15rem] text-[#17120d] outline-none placeholder:text-[#17120d]/35 focus:border-[#842219]'
            />
          </label>
          <button
            type='submit'
            disabled={!draft.trim()}
            className='flex h-11 items-center gap-2 bg-[#17120d] px-4 text-[.75rem] font-semibold tracking-[.14em] text-[#ecdcbc] uppercase transition-colors hover:bg-[#842219] disabled:opacity-40'
          >
            {t('dp.ask.submit')} <CornerDownLeft aria-hidden className='size-3.5' />
          </button>
        </form>
      </div>
    </section>
  )
}
