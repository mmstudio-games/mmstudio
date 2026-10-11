import { ArrowUpRight, CornerDownLeft, RefreshCw } from 'lucide-react'
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Redacted } from '@/components/motion/redacted'
import { TypedText } from '@/components/motion/typed-text'
import { cn } from '@/lib/utils'

import { CASE_ARCHIVE } from '../case-archive'
import { hasDraft, type InterviewBrief, interviewBrief, loadDraft } from '../case-drafts'
import { PaperSection } from './paper-section'

const GAME_URL = 'https://deadpan.hydroroll.team/'
const MAX_ENTRIES = 5
/** 中文界面默认坐在桌对面的是这一宗的探长。 */
const DEFAULT_CASE = 'CASE #3003-T1-IN0X'
const LABEL = 'font-mono text-[.58rem] tracking-[.22em] text-ink/60 uppercase'
/** 巨大的「问」「答」。 */
const GLYPH = 'font-serif-sc text-[clamp(5rem,10.5vw,12rem)] leading-[.84] font-black select-none'
/** 机密条的长短按条目轮换，像长短不一的回答。 */
const BAR_WIDTHS = ['w-[86%]', 'w-[62%]', 'w-[94%]', 'w-[71%]', 'w-[80%]']

/** 可以坐到桌对面的人：每宗编辑部卷宗公开开卷页上的调查资源。 */
const PEOPLE = CASE_ARCHIVE.flatMap((item) => item.resources.map((resource) => ({ item, resource })))

type Line = InterviewBrief['lines'][number]
type Entry = { id: number; text: string; time: string; to: string; answer: Line | null }

/** 虚字：只含实字的词片才算「问到了」，带虚字的只作参考。 */
const FILLER = new Set('的了是在有和与为不没吗呢吧啊么什谁几个这那你我他她它们就都也还很又或及其上下中里把被对从到')

/** 把一句话拆成相邻两字的词片（去掉标点与空白）。 */
function grams(text: string) {
  const clean = text.replace(/[\s\p{P}\p{S}]/gu, '')
  const set = new Set<string>()
  for (let index = 0; index + 1 < clean.length; index++) set.add(clean.slice(index, index + 2))
  return set
}

/**
 * 问到点子上才开口：在这位人物还没说过的原话里，找和问题最沾边的一条。
 * 词片在越少的原话里出现，分量越重；带虚字的词片分量减半；至少要有一个实字词片重合才算问到。
 * 没问到返回 null。不改写原话，也不生成任何内容。
 */
function answerFor(question: string, lines: readonly Line[], said: ReadonlySet<string>) {
  const asked = grams(question)
  const sets = lines.map((line) => grams(line.text))
  const spread = new Map<string, number>()
  for (const set of sets) for (const gram of set) spread.set(gram, (spread.get(gram) ?? 0) + 1)

  let best: Line | null = null
  let top = 0
  lines.forEach((line, index) => {
    if (said.has(line.text)) return
    let score = 0
    let solid = false
    for (const gram of sets[index]) {
      if (!asked.has(gram)) continue
      const plain = !FILLER.has(gram[0]) && !FILLER.has(gram[1])
      if (plain) solid = true
      score += (plain ? 1 : 0.5) / (spread.get(gram) ?? 1)
    }
    if (solid && score > top) {
      top = score
      best = line
    }
  })
  return best as Line | null
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className='min-w-0'>
      <p className={LABEL}>{label}</p>
      <p
        className={cn(
          'mt-1 line-clamp-2 leading-tight',
          mono
            ? 'font-mono text-[.8rem] tracking-[.12em] break-all'
            : 'font-serif-sc text-[clamp(1.05rem,1.5vw,1.45rem)] font-black',
        )}
      >
        {value}
      </p>
    </div>
  )
}

/** 笔录里的一条：左边是誊写下来的问题；右边问到了就是一句原话，没问到就盖着机密条。 */
function Row({ entry }: { entry: Entry }) {
  const { t } = useTranslation()
  const [peek, setPeek] = useState(false)
  // 问题打完之后，回答才开始打
  const [speaking, setSpeaking] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setSpeaking(true), Array.from(entry.text).length * 28 + 500)
    return () => window.clearTimeout(timer)
  }, [entry.text])

  return (
    <li className='grid animate-in grid-cols-2 border-b border-ink/25 duration-500 fade-in slide-in-from-top-2 last:border-b-0'>
      <div className='py-[1.5vh] pr-[2.4vw]'>
        <p className={LABEL}>
          <span className='text-seal'>N°{String(entry.id).padStart(2, '0')}</span> · {entry.time} ·{' '}
          {t('dp.ask.to', { name: entry.to })}
        </p>
        <p className='mt-1 font-serif-sc text-[clamp(1.02rem,1.4vw,1.36rem)] leading-[1.5] font-bold'>
          <TypedText text={entry.text} caretClassName='text-seal' />
        </p>
      </div>
      {entry.answer ? (
        <div className='py-[1.5vh] pl-[2.4vw]'>
          <p className={LABEL}>
            <span className='text-seal'>{entry.answer.label}</span> · {entry.to}
          </p>
          <p className='mt-1 min-h-[1.5em] font-serif-sc text-[clamp(1.02rem,1.4vw,1.36rem)] leading-[1.5] font-bold'>
            <TypedText text={entry.answer.text} active={speaking} caretClassName='text-seal' />
          </p>
        </div>
      ) : (
        <div className='flex items-center py-[1.5vh] pl-[2.4vw]'>
          <button
            type='button'
            onPointerEnter={() => setPeek(true)}
            onPointerLeave={() => setPeek(false)}
            onFocus={() => setPeek(true)}
            onBlur={() => setPeek(false)}
            className='w-full text-left font-serif-sc text-[clamp(1rem,1.3vw,1.25rem)] font-bold'
          >
            <Redacted
              revealed={peek}
              barClassName='bg-ink'
              className={cn('py-1', BAR_WIDTHS[(entry.id - 1) % BAR_WIDTHS.length])}
            >
              {t('dp.ask.pending')}
            </Redacted>
          </button>
        </div>
      )}
    </li>
  )
}

/**
 * 03 盘问 · 讯问笔录：一张横贯版面的笔录，左问右答，中间的竖线是上一段影片里那张桌子的桌沿。
 * 表头填的是真实卷宗与被讯问人；访客写下的问题被誊写进笔录。有设计稿的人物问到点子上会用原话回答，
 * 其余回答盖着机密条。本页不生成任何回答。
 */
export function PaperRecord() {
  const { t, i18n } = useTranslation()
  const zh = i18n.language.startsWith('zh')
  const start = useMemo(() => {
    const index = PEOPLE.findIndex(({ item }) => (zh ? item.caseNo === DEFAULT_CASE : item.edition === 'en'))
    return Math.max(0, index)
  }, [zh])
  const [who, setWho] = useState(start)
  useEffect(() => setWho(start), [start])
  const { item, resource } = PEOPLE[who]
  const name = `${resource.role} ${resource.name}`

  // 这位人物在设计稿里的一句话、建议追问与能说的原话（只有不封存的章节才会给）
  const [brief, setBrief] = useState<InterviewBrief | null>(null)
  useEffect(() => {
    setBrief(null)
    if (!hasDraft(item.caseNo)) return
    let live = true
    void loadDraft(item.caseNo).then((draft) => {
      if (live && draft) setBrief(interviewBrief(draft, resource.name))
    })
    return () => {
      live = false
    }
  }, [item.caseNo, resource.name])

  const [entries, setEntries] = useState<Entry[]>([])
  const [draft, setDraft] = useState('')
  const counter = useRef(0)
  // 每位人物已经说过的原话，不重复说
  const said = useRef(new Map<string, Set<string>>())
  const input = useRef<HTMLInputElement>(null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const text = draft.trim().slice(0, 80)
    if (!text) return
    const time = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
    counter.current++
    // 最新一条在最上
    let heard = said.current.get(name)
    if (!heard) {
      heard = new Set()
      said.current.set(name, heard)
    }
    const answer = brief ? answerFor(text, brief.lines, heard) : null
    if (answer) heard.add(answer.text)
    setEntries((list) => [{ id: counter.current, text, time, to: name, answer }, ...list].slice(0, MAX_ENTRIES))
    setDraft('')
  }

  return (
    <PaperSection id='record' label={t('dp.ask.record')} className='min-h-0 pt-[13vh] pb-[12vh]'>
      <div className='flex items-end justify-between gap-8 pb-[4vh]'>
        <h3 className='font-serif-sc text-[clamp(2.4rem,6.2vw,6.8rem)] leading-[.98] font-black tracking-[-.01em]'>
          {t('dp.ask.label')}
        </h3>
        <p className={cn(LABEL, 'pb-[1vh] text-right leading-loose text-ink')}>
          <span className='text-seal'>(03)</span> {t('dp.chapters.ask')} — {t('dp.ask.record')}
          <br />
          {t('deadpan.meta1')}
        </p>
      </div>

      <div className='border border-ink bg-paper-light px-[clamp(1.25rem,2.6vw,2.8rem)] pt-[2.6vh] pb-[2vh] shadow-[12px_14px_0_#17120d]'>
        {/* 表头：真实卷宗与被讯问人 */}
        <header className='grid grid-cols-[auto_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.3fr)_auto] items-end gap-x-[2.6vw] border-b-[3px] border-double border-ink pb-[1.6vh]'>
          <p
            className={cn(
              'font-serif-sc leading-none font-black',
              zh
                ? 'text-[clamp(1.3rem,2vw,2rem)] tracking-[.3em]'
                : 'text-[clamp(1.1rem,1.5vw,1.5rem)] tracking-[.02em]',
            )}
          >
            {t('dp.ask.record')}
          </p>
          <Field label={t('dp.ask.cause')} value={item.name} />
          <Field label={t('dp.ask.caseNo')} value={item.caseNo} mono />
          <Field label={t('dp.ask.subject')} value={name} />
          <button
            type='button'
            onClick={() => setWho((index) => (index + 1) % PEOPLE.length)}
            data-cursor={t('dp.ask.swap')}
            className='group flex items-center gap-2 border border-ink px-3 py-2 font-serif-sc text-[.82rem] font-bold tracking-[.14em] transition-colors hover:bg-ink hover:text-paper-light'
          >
            <RefreshCw aria-hidden className='size-3.5 transition-transform duration-500 group-hover:rotate-180' />
            {t('dp.ask.swap')}
          </button>
        </header>

        <div className='relative before:absolute before:inset-y-0 before:left-1/2 before:w-px before:bg-ink/55'>
          <div className='grid grid-cols-2 border-b border-ink'>
            {/* 问：输入就在这里 */}
            <div className='flex gap-[1.8vw] pt-[2.6vh] pr-[2.4vw] pb-[2.4vh]'>
              <span aria-hidden className={cn(GLYPH, 'text-seal')}>
                {t('dp.ask.q')}
              </span>
              <form onSubmit={submit} className='flex min-w-0 flex-1 flex-col justify-end gap-[1.4vh]'>
                <label className='flex flex-col gap-1'>
                  <span className={LABEL}>{t('dp.ask.label')}</span>
                  <input
                    ref={input}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    maxLength={80}
                    placeholder={t('dp.ask.placeholder')}
                    className='w-full border-b-2 border-ink bg-transparent py-2 font-serif-sc text-[clamp(1.1rem,1.6vw,1.5rem)] font-bold text-ink outline-none placeholder:font-normal placeholder:text-ink/35 focus:border-seal'
                  />
                </label>
                <div className='flex items-center justify-between gap-4'>
                  <span className={LABEL}>{t('dp.ask.count', { n: entries.length, max: MAX_ENTRIES })}</span>
                  <button
                    type='submit'
                    disabled={!draft.trim()}
                    className='flex items-center gap-2 bg-ink px-5 py-2.5 font-serif-sc text-[.9rem] font-black tracking-[.3em] text-paper-light transition-colors hover:bg-seal disabled:opacity-35'
                  >
                    {t('dp.ask.submit')} <CornerDownLeft aria-hidden className='size-3.5' />
                  </button>
                </div>
              </form>
            </div>

            {/* 答：拦腰一道机密条 */}
            <div className='flex gap-[1.8vw] pt-[2.6vh] pb-[2.4vh] pl-[2.4vw]'>
              <span aria-hidden className={cn(GLYPH, 'relative')}>
                {t('dp.ask.a')}
                <span className='absolute -inset-x-[7%] top-[37%] flex h-[27%] items-center justify-center bg-ink font-mono text-[.56rem] font-normal tracking-[.4em] text-paper-light uppercase'>
                  {t('dp.book.stamp')}
                </span>
              </span>
              <div className='flex min-w-0 flex-1 flex-col justify-end gap-[1.2vh]'>
                {brief?.quote && (
                  <blockquote className='border-l-[3px] border-seal pl-3 font-serif-sc text-[clamp(1rem,1.35vw,1.3rem)] leading-[1.6] font-bold'>
                    {brief.quote}
                    <footer className={cn(LABEL, 'mt-1 font-normal')}>{name}</footer>
                  </blockquote>
                )}
                <p className='font-serif-sc text-[.9rem] leading-[1.8] text-ink/80'>
                  {t(brief?.lines.length ? 'dp.ask.noteOpen' : 'dp.film.recordNote')}
                </p>
              </div>
            </div>
          </div>

          {/* 建议追问：点一条就填进输入框 */}
          {brief && brief.asks.length > 0 && (
            <div className='grid grid-cols-2 border-b border-ink/25'>
              <div className='flex flex-wrap items-center gap-2 py-[1.4vh] pr-[2.4vw]'>
                <span className={cn(LABEL, 'mr-1')}>{t('dp.ask.suggest')}</span>
                {brief.asks.map((ask) => (
                  <button
                    key={ask}
                    type='button'
                    onClick={() => {
                      setDraft(ask)
                      input.current?.focus()
                    }}
                    className='border border-ink/60 px-2.5 py-1 font-serif-sc text-[.84rem] transition-colors hover:border-seal hover:text-seal'
                  >
                    {ask}
                  </button>
                ))}
              </div>
            </div>
          )}

          {entries.length === 0 ? (
            <p className='grid min-h-[16vh] grid-cols-2 items-center font-serif-sc text-ink/45'>
              <span className='pr-[2.4vw]'>{t('dp.ask.empty')}</span>
            </p>
          ) : (
            <ol aria-live='polite'>
              {entries.map((entry) => (
                <Row key={entry.id} entry={entry} />
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* 去处：到这一卷里去问，或直接进入游戏 */}
      <div className='flex flex-wrap items-center gap-x-8 gap-y-3 pt-[5vh]'>
        <a
          href={item.url}
          target='_blank'
          rel='noreferrer'
          data-cursor={t('dp.catalog.open')}
          className='group flex items-center gap-3 bg-ink px-6 py-4 font-serif-sc text-[1.05rem] font-black tracking-[.24em] text-paper no-underline transition-colors hover:bg-seal'
        >
          {t('dp.ask.inCase')}
          <ArrowUpRight
            aria-hidden
            className='size-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1'
          />
        </a>
        <a
          href={GAME_URL}
          target='_blank'
          rel='noreferrer'
          className='border-b border-ink pb-1 font-mono text-[.66rem] tracking-[.22em] text-ink uppercase no-underline transition-colors hover:border-seal hover:text-seal'
        >
          {t('deadpan.play')} ↗
        </a>
      </div>
    </PaperSection>
  )
}
