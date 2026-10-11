import { gsap } from 'gsap'
import { ArrowUpRight } from 'lucide-react'
import { type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { getLenis } from '@/lib/smooth-scroll'
import { cn } from '@/lib/utils'

import { type ArchivedCase, CASE_ARCHIVE } from '../case-archive'
import { type CaseDraft, hasDraft, loadDraft } from '../case-drafts'
import { DraftReader } from './draft-reader'
import { filmEngine } from './film-store'
import { Seal } from './paper-kit'

const TABS = ['enclosed', 'resources', 'drafts'] as const
type Tab = (typeof TABS)[number]

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className='border-t border-paper/25 pt-2'>
      <dt className='font-mono text-[.56rem] tracking-[.22em] text-paper/55 uppercase'>{label}</dt>
      <dd className='mt-1 font-serif-sc text-[.92rem] leading-snug'>{value}</dd>
    </div>
  )
}

/** 卷宗夹右侧的一页：随卷材料、调查资源或设计稿。 */
function Sheet({
  item,
  tab,
  draft,
  unsealed,
  onUnseal,
}: {
  item: ArchivedCase
  tab: Tab
  draft: CaseDraft | null
  unsealed: boolean
  onUnseal: () => void
}) {
  const { t } = useTranslation()
  if (tab === 'enclosed') {
    return (
      <table className='w-full border-collapse text-left'>
        <thead>
          <tr className='border-b-2 border-ink font-mono text-[.56rem] tracking-[.22em] uppercase'>
            <th className='w-14 py-2 font-normal'>{t('dp.dossier.no')}</th>
            <th className='py-2 font-normal'>{t('dp.dossier.item')}</th>
            <th className='w-20 py-2 text-right font-normal'>{t('dp.dossier.layer')}</th>
          </tr>
        </thead>
        <tbody>
          {item.enclosed.map((entry) => (
            <tr key={`${entry.no}-${entry.title}`} className='border-b border-ink/30'>
              <td className='py-[1.6vh] font-mono text-[.7rem] tracking-[.14em] text-seal'>{entry.no}</td>
              <td className='py-[1.6vh] font-serif-sc text-[clamp(1.05rem,1.5vw,1.35rem)] font-bold'>{entry.title}</td>
              <td className='py-[1.6vh] text-right'>
                <span className='border border-ink/60 px-2 py-0.5 font-serif-sc text-[.72rem]'>{entry.layer}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }
  if (tab === 'resources') {
    return (
      <ul>
        {item.resources.map((entry) => (
          <li key={`${entry.role}-${entry.name}`} className='border-b border-ink/30 py-[2.4vh]'>
            <p className='font-mono text-[.6rem] tracking-[.2em] text-seal uppercase'>{entry.role}</p>
            <p className='mt-2 font-serif-sc text-[clamp(1.5rem,2.4vw,2.2rem)] leading-none font-black'>{entry.name}</p>
          </li>
        ))}
      </ul>
    )
  }
  if (!hasDraft(item.caseNo)) {
    return (
      <div className='flex h-full min-h-[38vh] flex-col items-center justify-center gap-6 border border-dashed border-ink/50 p-8 text-center'>
        <Seal className='text-[1.5rem]'>{t('dp.dossier.pending')}</Seal>
        <p className='max-w-[24rem] font-serif-sc text-[.98rem] leading-[1.9]'>{t('dp.dossier.pendingBody')}</p>
      </div>
    )
  }
  if (!draft) return <p className='py-10 text-center font-serif-sc text-ink/55'>{t('dp.draft.loading')}</p>
  return <DraftReader draft={draft} unsealed={unsealed} onUnseal={onUnseal} gameUrl={item.url} />
}

/**
 * 卷宗夹：从架上抽出的一宗案卷。左边是案由，右边按页签翻看随卷材料、调查资源与设计稿。
 * index 为 null 时合上。
 */
export function DossierFolder({ index, onClose }: { index: number | null; onClose: () => void }) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('enclosed')
  const [draft, setDraft] = useState<CaseDraft | null>(null)
  // 设计稿里封存的章节是否已拆封；每次打开卷宗都从封存开始
  const [unsealed, setUnsealed] = useState(false)
  const sheet = useRef<HTMLDivElement>(null)
  const tabs = useRef(new Map<Tab, HTMLButtonElement>())
  // 合上后焦点回到卷宗架列表里的这一宗
  const origin = useRef<HTMLElement | null>(null)
  // 合上的过程中仍显示上一宗，避免内容先消失
  const last = useRef(0)
  if (index !== null) {
    last.current = index
    origin.current = document.querySelector<HTMLElement>(`[data-case-index="${index}"]`)
  }
  const item = CASE_ARCHIVE[last.current]
  const open = index !== null

  // 打开时停住页面滚动与影片里的悬停
  useEffect(() => {
    if (!open) return
    setTab('enclosed')
    getLenis()?.stop()
    filmEngine.current?.setInteractive(false)
    return () => {
      getLenis()?.start()
      filmEngine.current?.setInteractive(true)
    }
  }, [open])

  // 每次打开都重新封存，并按需取这一宗的设计稿
  const caseNo = item.caseNo
  useEffect(() => {
    setUnsealed(false)
    setDraft(null)
    if (!open) return
    let live = true
    void loadDraft(caseNo).then((loaded) => {
      if (live) setDraft(loaded)
    })
    return () => {
      live = false
    }
  }, [open, caseNo])

  const turn = (next: Tab) => {
    if (next === tab) return
    const forward = TABS.indexOf(next) > TABS.indexOf(tab)
    setTab(next)
    if (sheet.current) {
      gsap.fromTo(
        sheet.current,
        { rotateY: forward ? -72 : 72, opacity: 0.2 },
        { rotateY: 0, opacity: 1, duration: 0.7, ease: 'power3.out', overwrite: true },
      )
    }
  }
  const key = (event: KeyboardEvent) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    const next = TABS[TABS.indexOf(tab) + step]
    if (!next) return
    turn(next)
    tabs.current.get(next)?.focus()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        onKeyDown={key}
        finalFocus={origin}
        closeLabel={t('dp.desk.close')}
        overlayClassName='bg-ink/70'
        className={cn(
          'grid h-[min(86vh,820px)] w-[min(92vw,1240px)] overflow-hidden bg-paper-light text-ink shadow-[14px_16px_0_rgba(0,0,0,.55)] transition-[grid-template-columns] duration-500 ease-out-expo sm:max-w-none',
          tab === 'drafts' && hasDraft(item.caseNo)
            ? 'grid-cols-[minmax(0,4fr)_minmax(0,8fr)]'
            : 'grid-cols-[minmax(0,5fr)_minmax(0,7fr)]',
        )}
      >
        {/* 案由 */}
        <div data-lenis-prevent className='flex flex-col overflow-y-auto bg-ink p-[clamp(1.5rem,3vw,3rem)] text-paper'>
          <p className='flex items-center justify-between font-mono text-[.6rem] tracking-[.22em] uppercase'>
            <span>{item.caseNo}</span>
            <span className='text-paper/55'>{t('dp.dossier.brief')}</span>
          </p>
          <p className='mt-[4vh] font-mono text-[.6rem] tracking-[.22em] text-accent uppercase'>
            {t(`dp.types.${item.type}`)} / {t(`dp.levels.${item.level}`)} /{' '}
            {t(item.edition === 'zh' ? 'dp.catalog.editionZh' : 'dp.catalog.editionEn')}
          </p>
          <DialogTitle className='mt-3 font-serif-sc text-[clamp(2rem,3.6vw,3.8rem)] leading-[1.08] font-black tracking-normal text-paper normal-case'>
            {item.name}
          </DialogTitle>
          <DialogDescription className='mt-[3vh] font-serif-sc text-[1rem] leading-[1.9] text-paper/80'>
            {item.opening}
          </DialogDescription>
          <dl className='mt-auto grid grid-cols-2 gap-x-6 gap-y-4 pt-[4vh]'>
            <Fact label={t('dp.dossier.when')} value={item.when} />
            <Fact label={t('dp.dossier.where')} value={item.where} />
            <Fact label={t('dp.dossier.people')} value={t('dp.dossier.peopleCount', { count: item.people })} />
            <Fact label={t('dp.dossier.material')} value={t('dp.dossier.materialCount', { count: item.materials })} />
            <Fact label={t('dp.dossier.filedBy')} value={item.filedBy} />
            <Fact label={t('dp.dossier.filedOn')} value={item.filedOn} />
          </dl>
        </div>

        {/* 页签与当前这一页 */}
        <div className='flex min-h-0 flex-col p-[clamp(1.5rem,3vw,3rem)] pr-[clamp(3.5rem,5vw,5rem)]'>
          <div role='tablist' aria-label={t('dp.dossier.title')} className='flex items-end gap-1 border-b-2 border-ink'>
            {TABS.map((name) => (
              <button
                key={name}
                type='button'
                role='tab'
                ref={(element) => {
                  if (element) tabs.current.set(name, element)
                }}
                aria-selected={tab === name}
                tabIndex={tab === name ? 0 : -1}
                onClick={() => turn(name)}
                className={cn(
                  'border border-b-0 border-ink px-4 py-2 font-serif-sc text-[.9rem] font-bold tracking-[.14em] transition-colors',
                  tab === name ? 'bg-ink text-paper' : 'bg-transparent text-ink hover:bg-ink/10',
                )}
              >
                {t(`dp.dossier.${name}`)}
                {name === 'drafts' && hasDraft(item.caseNo) && (
                  <span aria-hidden className='ml-2 inline-block size-1.5 -translate-y-0.5 bg-seal' />
                )}
              </button>
            ))}
          </div>
          <div
            data-lenis-prevent
            className='min-h-0 flex-1 overflow-x-hidden overflow-y-auto pt-[3vh] pr-4 [perspective:1600px] [scrollbar-color:var(--color-ink)_transparent] [scrollbar-width:thin]'
          >
            <div ref={sheet} role='tabpanel' className='h-full origin-left'>
              <Sheet item={item} tab={tab} draft={draft} unsealed={unsealed} onUnseal={() => setUnsealed(true)} />
            </div>
          </div>
          <div className='flex items-end justify-between gap-6 border-t border-ink/40 pt-4'>
            <p className='max-w-[26rem] font-serif-sc text-[.74rem] leading-relaxed text-ink/65'>
              {t('dp.dossier.publicNote')}
            </p>
            <a
              href={item.url}
              target='_blank'
              rel='noreferrer'
              className='group flex shrink-0 items-center gap-2 bg-ink px-5 py-3 font-serif-sc text-[.95rem] font-black tracking-[.2em] text-paper no-underline transition-colors hover:bg-seal'
            >
              {t('dp.dossier.openInGame')}
              <ArrowUpRight
                aria-hidden
                className='size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5'
              />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
