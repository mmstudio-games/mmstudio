import { ArrowUpRight } from 'lucide-react'
import { type ReactNode, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import type { CaseDraft, DraftBlock, DraftPart } from '../case-drafts'
import { Seal } from './paper-kit'

const LABEL = 'font-mono text-[.56rem] tracking-[.22em] text-ink/60 uppercase'
const BODY = 'font-serif-sc text-[.96rem] leading-[1.95]'
/** 机密条的宽度（百分比），按顺序循环使用，看起来像被涂掉的几行字。 */
const BARS = [96, 88, 100, 72, 93, 64]

/** 十分制的数值，画成十格的小条。 */
function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className='flex items-center gap-2'>
      <span className='font-serif-sc text-[.8rem] font-bold'>{label}</span>
      <span className='flex gap-px' role='img' aria-label={`${label} ${value}/10`}>
        {Array.from({ length: 10 }, (_, index) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: 十个格子位置固定
            key={index}
            className={cn('h-2.5 w-[5px]', index < value ? 'bg-ink' : 'bg-ink/15')}
          />
        ))}
      </span>
      <span className='font-mono text-[.6rem] tracking-[.1em] text-ink/70'>{value}/10</span>
    </div>
  )
}

function Block({ block }: { block: DraftBlock }) {
  switch (block.kind) {
    case 'text':
      return <p className={BODY}>{block.text}</p>
    case 'quote':
      return (
        <blockquote className='border-l-[3px] border-seal pl-4 font-serif-sc text-[1.12rem] leading-[1.8] font-bold'>
          {block.text}
        </blockquote>
      )
    case 'notice':
      return (
        <p className='border border-seal px-4 py-2 text-center font-serif-sc text-[.86rem] font-bold tracking-[.1em] text-seal'>
          {block.text}
        </p>
      )
    case 'facts':
      return (
        <dl className='grid grid-cols-2 gap-x-6 gap-y-3'>
          {block.items.map(([label, value]) => (
            <div key={label} className='border-t border-ink/30 pt-2'>
              <dt className={LABEL}>{label}</dt>
              <dd className='mt-1 font-serif-sc text-[.96rem] leading-snug font-bold'>{value}</dd>
            </div>
          ))}
        </dl>
      )
    case 'tags':
      return (
        <ul className='flex flex-wrap gap-2'>
          {block.items.map((item) => (
            <li key={item} className='border border-ink/70 px-2.5 py-1 font-serif-sc text-[.8rem] font-bold'>
              {item}
            </li>
          ))}
        </ul>
      )
    case 'list': {
      const List = block.ordered ? 'ol' : 'ul'
      return (
        <div>
          {block.label && <p className={cn(LABEL, 'mb-2')}>{block.label}</p>}
          <List className={cn(BODY, 'flex flex-col gap-1.5')}>
            {block.items.map((item, index) => (
              <li key={item} className='grid grid-cols-[1.6rem_1fr]'>
                <span className='font-mono text-[.68rem] leading-[2.7] text-seal'>
                  {block.ordered ? `${index + 1}.` : '—'}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </List>
        </div>
      )
    }
    case 'table':
      return (
        <table className='w-full border-collapse border-y-2 border-ink text-left'>
          <thead>
            <tr className='border-b border-ink'>
              {block.head.map((cell) => (
                <th key={cell} className={cn(LABEL, 'py-2 pr-3 font-normal')}>
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row) => (
              <tr key={row.join('|')} className='border-b border-ink/25 align-top last:border-b-0'>
                {row.map((cell, index) => (
                  <td
                    // biome-ignore lint/suspicious/noArrayIndexKey: 单元格按列位置区分
                    key={index}
                    className={cn(
                      'py-2 pr-3 font-serif-sc text-[.88rem] leading-[1.7]',
                      index === 0 && 'font-bold whitespace-nowrap',
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )
    case 'timeline':
      return (
        <table className='w-full border-collapse border-y-2 border-ink text-left'>
          <thead>
            <tr className='border-b border-ink'>
              <th className={cn(LABEL, 'w-[9.5rem] py-2 pl-3 font-normal')}>{block.head[0]}</th>
              <th className={cn(LABEL, 'py-2 font-normal')}>{block.head[1]}</th>
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row) => (
              <tr
                key={row.when}
                className={cn('border-b border-ink/25 align-top last:border-b-0', row.key && 'bg-seal/8')}
              >
                <td
                  className={cn(
                    'border-l-[3px] py-2.5 pr-3 pl-3 font-serif-sc text-[.88rem] font-bold whitespace-nowrap',
                    row.key ? 'border-seal text-seal' : 'border-transparent',
                  )}
                >
                  {row.when}
                </td>
                <td className={cn('py-2.5 font-serif-sc text-[.9rem] leading-[1.75]', row.key && 'text-seal')}>
                  {row.what}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    case 'entry':
      return (
        <div>
          <p className='font-serif-sc text-[1rem] font-black'>{block.title}</p>
          <p className={cn(BODY, 'mt-1')}>{block.text}</p>
        </div>
      )
    case 'profile':
      return (
        <article className='border border-ink/60 p-4'>
          <header className='flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-ink pb-2'>
            <span className='font-mono text-[.7rem] tracking-[.14em] text-seal'>{block.code}</span>
            <h5 className='font-serif-sc text-[1.3rem] leading-none font-black'>{block.name}</h5>
            <span className='font-serif-sc text-[.82rem] font-bold text-ink/75'>{block.role}</span>
          </header>
          <div className='flex flex-wrap gap-x-5 gap-y-1.5 py-3'>
            {block.meters.map(([label, value]) => (
              <Meter key={label} label={label} value={value} />
            ))}
          </div>
          <dl className='flex flex-col gap-1.5'>
            {block.fields.map(([label, value]) => (
              <div key={label} className='grid grid-cols-[4.6rem_1fr] gap-x-2'>
                <dt className='font-serif-sc text-[.84rem] font-bold text-ink/65'>{label}</dt>
                <dd className='font-serif-sc text-[.9rem] leading-[1.7]'>{value}</dd>
              </div>
            ))}
          </dl>
        </article>
      )
  }
}

/** 封存中的内容：几道机密条。 */
function Bars({ count = 4 }: { count?: number }) {
  return (
    <div aria-hidden className='flex flex-col gap-2 py-1'>
      {Array.from({ length: count }, (_, index) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: 机密条只是装饰，顺序固定
          key={index}
          className='block h-[.95rem] bg-ink'
          style={{ width: `${BARS[index % BARS.length]}%` }}
        />
      ))}
    </div>
  )
}

function Part({ part, hidden, revealed }: { part: DraftPart; hidden: boolean; revealed: boolean }) {
  const { t } = useTranslation()
  return (
    <div className={cn(revealed && 'border-l-2 border-seal pl-4')}>
      {part.title && (
        <h4 className='flex items-baseline justify-between gap-4 font-serif-sc text-[1.12rem] font-black'>
          {part.title}
          {hidden && <span className={cn(LABEL, 'shrink-0 text-seal')}>{t('dp.draft.sealedHint')}</span>}
        </h4>
      )}
      {hidden ? (
        <Bars count={3} />
      ) : (
        <div className={cn('flex flex-col gap-4', part.title && 'mt-3', revealed && 'animate-in duration-700 fade-in')}>
          {part.blocks.map((block, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: 内容块顺序即原件顺序，不会重排
            <Block key={index} block={block} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * 设计稿阅读器：封面、目录、正文各章。封存的章节只露章名与机密条，
 * 拆封要先确认；拆封与否由卷宗夹保管，合上再打开会重新封存。
 */
export function DraftReader({
  draft,
  unsealed,
  onUnseal,
  gameUrl,
}: {
  draft: CaseDraft
  unsealed: boolean
  onUnseal: () => void
  gameUrl: string
}) {
  const { t } = useTranslation()
  const [asking, setAsking] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const sealedCount = draft.sections.reduce(
    (sum, section) =>
      sum + (section.sealed ? section.parts.length : section.parts.filter((part) => part.sealed).length),
    0,
  )
  const jump = (no: string) =>
    root.current?.querySelector(`[data-section="${no}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  let status: ReactNode
  if (unsealed) {
    status = <span className={cn(LABEL, 'shrink-0 text-seal')}>{t('dp.draft.unsealed')}</span>
  } else {
    status = (
      <button
        type='button'
        onClick={() => setAsking(true)}
        className='flex shrink-0 items-center gap-3 border border-seal px-3 py-1.5 font-serif-sc text-[.82rem] font-black tracking-[.2em] text-seal transition-colors hover:bg-seal hover:text-paper-light'
      >
        <span className='font-mono text-[.54rem] font-normal tracking-[.16em] uppercase'>
          {t('dp.draft.sealedCount', { count: sealedCount })}
        </span>
        {t('dp.draft.unseal')}
      </button>
    )
  }

  return (
    <div ref={root} className='flex flex-col gap-[4vh] pb-[4vh]'>
      {/* 原件自己的说明，与封存状态 */}
      <div className='flex items-center justify-between gap-4 border-y border-ink py-2.5'>
        <p className='font-serif-sc text-[.82rem] leading-snug'>
          <span className={cn(LABEL, 'mr-3')}>{t('dp.draft.source')}</span>
          {draft.notice}
        </p>
        {status}
      </div>

      {asking && !unsealed && (
        <div role='alert' className='border-2 border-seal p-5'>
          <p className='font-serif-sc text-[1.2rem] leading-snug font-black text-seal'>{t('dp.draft.warnTitle')}</p>
          <p className={cn(BODY, 'mt-2')}>{t('dp.draft.warnBody')}</p>
          <div className='mt-4 flex flex-wrap gap-3'>
            <a
              href={gameUrl}
              target='_blank'
              rel='noreferrer'
              className='group flex items-center gap-2 bg-ink px-4 py-2.5 font-serif-sc text-[.9rem] font-black tracking-[.16em] text-paper no-underline transition-colors hover:bg-seal'
            >
              {t('dp.draft.warnStay')}
              <ArrowUpRight aria-hidden className='size-4' />
            </a>
            <button
              type='button'
              onClick={() => {
                setAsking(false)
                onUnseal()
              }}
              className='border border-ink px-4 py-2.5 font-serif-sc text-[.9rem] font-black tracking-[.16em] transition-colors hover:border-seal hover:text-seal'
            >
              {t('dp.draft.warnGo')}
            </button>
          </div>
        </div>
      )}

      {/* 封面 */}
      <header>
        <p className='font-serif-sc text-[clamp(2rem,3.4vw,3.2rem)] leading-none font-black'>{draft.title}</p>
        <p className='mt-2 font-serif-sc text-[1.1rem] font-bold'>{draft.subtitle}</p>
        {draft.english && <p className={cn(LABEL, 'mt-1')}>{draft.english}</p>}
        <dl className='mt-5 grid grid-cols-2 gap-x-6 gap-y-3'>
          {[...draft.facts, ...(unsealed ? (draft.sealedFacts ?? []) : [])].map(([label, value]) => (
            <div key={label} className='border-t border-ink/30 pt-2'>
              <dt className={LABEL}>{label}</dt>
              <dd className='mt-1 font-serif-sc text-[.92rem] leading-snug'>{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      {/* 目录 */}
      <nav aria-label={t('dp.draft.contents')} className='border-y-2 border-ink py-3'>
        <p className={LABEL}>{t('dp.draft.contents')}</p>
        <ol className='mt-2 grid grid-cols-2 gap-x-6'>
          {draft.sections.map((section) => {
            const hidden = Boolean(section.sealed) && !unsealed
            return (
              <li key={section.no}>
                <button
                  type='button'
                  onClick={() => jump(section.no)}
                  className='flex w-full items-baseline gap-2 border-b border-ink/20 py-1.5 text-left font-serif-sc text-[.9rem] font-bold transition-colors hover:text-seal'
                >
                  <span className='w-5 font-mono text-[.62rem] font-normal text-seal'>{section.no}</span>
                  <span className='flex-1'>{hidden ? (section.sealedTitle ?? section.title) : section.title}</span>
                  {section.sealed && (
                    <span aria-hidden className={cn('size-1.5', unsealed ? 'bg-ink/25' : 'bg-seal')} />
                  )}
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      {draft.sections.map((section) => {
        const hidden = Boolean(section.sealed) && !unsealed
        return (
          <section key={section.no} data-section={section.no} className='scroll-mt-4'>
            <h3 className='flex items-end justify-between gap-4 border-b-2 border-ink pb-2'>
              <span className='flex items-baseline gap-3 font-serif-sc text-[clamp(1.4rem,2.2vw,2rem)] leading-tight font-black'>
                <span className='font-heading text-[.8em] text-seal'>{section.no}</span>
                {hidden ? (section.sealedTitle ?? section.title) : section.title}
              </span>
              {hidden && <Seal className='mb-1 shrink-0 text-[.8rem]'>{t('dp.draft.sealed')}</Seal>}
            </h3>
            {hidden ? (
              <div className='pt-4'>
                <Bars count={5} />
                <p className={cn(LABEL, 'mt-3 text-seal')}>{t('dp.draft.sealedHint')}</p>
              </div>
            ) : (
              <div className='flex flex-col gap-[3.2vh] pt-4'>
                {section.parts.map((part, index) => (
                  <Part
                    // biome-ignore lint/suspicious/noArrayIndexKey: 各节顺序即原件顺序，不会重排
                    key={index}
                    part={part}
                    hidden={Boolean(part.sealed) && !unsealed}
                    revealed={unsealed && Boolean(section.sealed || part.sealed)}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}

      <p className={cn(LABEL, 'border-t border-ink pt-3 text-center')}>{draft.closing}</p>
    </div>
  )
}
