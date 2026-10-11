import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import {
  Component,
  type CSSProperties,
  lazy,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'

import { Magnetic } from '@/components/motion/magnetic'
import { RollText } from '@/components/motion/roll-text'
import { SectionLabel } from '@/components/site/section-label'
import { useFinePointer, useMediaQuery, useReducedMotion } from '@/hooks/use-media-query'
import { DEADPAN_URL } from '@/i18n'
import { cn } from '@/lib/utils'
import { usePreferencesStore } from '@/stores/preferences-store'
import { AskRecord } from './ask-record'
import {
  ASK_SPREAD,
  BOARD_SPREAD,
  END_SPREAD,
  PAPER_SPREAD,
  pageSize,
  Q_MAX,
  SECTION_HEIGHT_SVH,
  SHOT,
  SPREADS,
  scrollToSpread,
  spreadAt,
} from './book-nav'
import { buildCopy, caseFace, PAGE_H, PAGE_W, TAB_H, TAB_W, TABS, type TabId, visibleCases } from './book-pages'
import { CASE_ARCHIVE, CASE_TYPES, CATALOG_URL, type CaseType } from './case-archive'
import { ClueWall } from './clue-wall'
import { DeadpanAsk } from './deadpan-ask'
import { DeadpanBoard } from './deadpan-board'
import { DeadpanCatalog } from './deadpan-catalog'
import { PenStroke } from './deadpan-desk'
import { DeadpanFinale } from './deadpan-finale'
import { DeadpanHero } from './deadpan-hero'
import { DeadpanPaper } from './deadpan-paper'
import {
  CardBox,
  Clipping,
  CoffeeRing,
  DeskBackdrop,
  DeskDefs,
  DeskDossier,
  DeskThread,
  EdgeDust,
  EvidenceTag,
  IndexCard,
  Inkwell,
  Magnifier,
  NewsStack,
  Notepad,
  Pencil,
  Pushpin,
} from './desk-props'
import { DeskTravel } from './desk-travel'
import { DUST_REVEAL_AT, useDeskDust } from './use-desk-dust'

const CaseBookScene = lazy(() => import('./case-book-scene'))

/** 书需要的最小视口；更小的屏幕走原来的竖排版本。 */
const BOOK_VIEWPORT = '(min-width: 900px) and (min-height: 560px)'

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return Boolean(gl)
  } catch {
    return false
  }
}

/** 场景加载或创建 WebGL 失败时，通知外层回到 DOM 版本。 */
class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

const navButton =
  'pointer-events-auto flex items-center gap-2 border border-[#17120d]/30 bg-[#efe4cb] px-4 py-2.5 font-mono text-[.66rem] tracking-[.18em] text-[#17120d] uppercase shadow-[0_10px_24px_rgba(0,0,0,.45)] transition-[opacity,background-color] duration-300 hover:bg-[#f7efdc] disabled:pointer-events-none disabled:opacity-30'

/** 红笔批注：合上的书右缘伸出四枚索引标签，批注沿标签写在桌面上。 */
function TabNotes({ stage, shown }: { stage: { w: number; h: number }; shown: boolean }) {
  const { t } = useTranslation()
  const page = pageSize(stage.w, stage.h)
  const k = page.width / PAGE_W
  const edge = stage.w / 2 + (page.width / 2 + TAB_W * k) * SHOT.wide
  return (
    <div aria-hidden className='pointer-events-none absolute inset-0 z-[24] [filter:url(#dp-type)]'>
      {TABS.map((tab, index) => {
        const y = stage.h / 2 + (-page.height / 2 + ((tab.y + TAB_H / 2) / PAGE_H) * page.height) * SHOT.wide
        return (
          <div key={tab.id} className='absolute' style={{ left: edge + 14, top: y - 20 }}>
            <svg aria-hidden='true' viewBox='0 0 44 24' className='absolute top-[7px] -left-1 w-11 overflow-visible'>
              <PenStroke d='M44 12 C 32 14 14 8 2 12' drawn={shown} delay={900 + index * 380} />
              <PenStroke d='M9 5 L2 12 L10 18' drawn={shown} delay={1250 + index * 380} />
            </svg>
            <span
              className={cn(
                'ml-11 block font-hand text-[clamp(1.5rem,2.1vw,2.1rem)] leading-none whitespace-nowrap text-[#b8321f] transition-opacity duration-700',
                shown ? 'opacity-100' : 'opacity-0',
              )}
              style={{ transitionDelay: `${700 + index * 380}ms`, rotate: `${index % 2 ? 3 : -4}deg` }}
            >
              {tab.number} {t(`dp.chapters.${tab.id}`)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** 每个跨页书旁的一笔红笔批注：跨页落定后，箭头指向书页，文字取自已有文案。 */
function SpreadNote({ spread, rest }: { spread: number; rest: number | null }) {
  const { t } = useTranslation()
  const notes: Record<number, { text: string; side: 'left' | 'right'; top: string }> = {
    1: { text: t('dp.desk.contents'), side: 'left', top: '38%' },
    2: { text: `${t('dp.catalog.all')} · ${CASE_ARCHIVE.length}`, side: 'left', top: '34%' },
    3: { text: t('dp.catalog.browse'), side: 'left', top: '55%' },
    4: { text: t('dp.board.drag'), side: 'right', top: '22%' },
    5: { text: t('dp.ask.label'), side: 'left', top: '44%' },
    6: { text: t('dp.paper.stamp'), side: 'right', top: '78%' },
  }
  const note = notes[spread]
  if (!note) return null
  const drawn = rest === spread
  const left = note.side === 'left'
  return (
    <div
      key={spread}
      aria-hidden
      className={cn(
        'pointer-events-none absolute z-[24] flex items-center gap-2 [filter:url(#dp-type)]',
        left ? 'left-[1.2%]' : 'right-[1.2%] flex-row-reverse',
      )}
      style={{ top: note.top }}
    >
      <span
        className={cn(
          'font-hand text-[clamp(1.4rem,2vw,2rem)] leading-none whitespace-nowrap text-[#b8321f] transition-opacity duration-700',
          drawn ? 'opacity-100' : 'opacity-0',
        )}
        style={{ rotate: left ? '-4deg' : '3deg' }}
      >
        {note.text}
      </span>
      <svg aria-hidden='true' viewBox='0 0 60 24' className='w-12 shrink-0 overflow-visible'>
        <PenStroke d={left ? 'M2 12 C 20 8 40 16 58 12' : 'M58 12 C 40 8 20 16 2 12'} drawn={drawn} delay={500} />
        <PenStroke d={left ? 'M50 5 L58 12 L49 18' : 'M10 5 L2 12 L11 18'} drawn={drawn} delay={1100} />
      </svg>
    </div>
  )
}

/** 收尾：书合上、镜头拉远后，桌面上的一句话与巨大的「开卷」入口。 */
function FinaleOverlay({ shown }: { shown: boolean }) {
  const { t } = useTranslation()
  const zh = usePreferencesStore((state) => state.locale) === 'zh-CN'
  return (
    <div
      inert={!shown}
      className={cn(
        'pointer-events-none absolute inset-0 z-30 transition-opacity duration-[900ms]',
        shown ? 'opacity-100' : 'opacity-0',
      )}
    >
      <p className='absolute top-1/2 left-[4%] w-[27%] -translate-y-1/2 font-serif-sc text-[clamp(1.4rem,2.4vw,2.4rem)] leading-[1.45] text-[#ecdcbc]/90'>
        {t('dp.finale.line')}
      </p>
      <div className='pointer-events-auto absolute top-1/2 right-[3%] flex -translate-y-1/2 flex-col items-end gap-5'>
        <Magnetic strength={0.15}>
          <a
            href={DEADPAN_URL}
            target='_blank'
            rel='noreferrer'
            data-cursor={t('deadpan.play')}
            className='group/roll relative flex items-center gap-[.1em] leading-none text-[#ecdcbc] no-underline'
          >
            <RollText
              text={t('dp.finale.cta')}
              className={
                zh
                  ? 'font-serif-sc text-[clamp(4rem,10vw,9rem)] font-black tracking-[.08em] transition-colors duration-500 group-hover/roll:text-accent'
                  : 'font-heading text-[clamp(2rem,4.2vw,4rem)] font-semibold tracking-[-.03em] transition-colors duration-500 group-hover/roll:text-accent'
              }
            />
            <ArrowUpRight
              aria-hidden
              className='size-[clamp(2rem,5vw,4.4rem)] stroke-1 transition-transform duration-700 ease-out-expo group-hover/roll:translate-x-2 group-hover/roll:-translate-y-2'
            />
            <span className='sr-only'>{t('a11y.external')}</span>
          </a>
        </Magnetic>
        <a
          href={CATALOG_URL}
          target='_blank'
          rel='noreferrer'
          className='group/roll flex items-center gap-2 font-mono text-[.7rem] tracking-[.2em] text-[#ecdcbc]/75 uppercase no-underline hover:text-[#ecdcbc]'
        >
          <RollText text={t('dp.catalog.browse')} />
          <ArrowUpRight aria-hidden className='size-3.5' />
        </a>
      </div>
    </div>
  )
}

function CaseBookSection({ onFail }: { onFail: () => void }) {
  const { t } = useTranslation()
  const fine = useFinePointer()
  const section = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const dustRef = useRef<HTMLCanvasElement>(null)
  const motesRef = useRef<HTMLCanvasElement>(null)
  const progress = useRef(0)
  const snap = useRef(true)
  const invalidateRef = useRef<(() => void) | null>(null)
  const [stage, setStage] = useState({ w: 0, h: 0 })
  const [spread, setSpread] = useState(0)
  const [rest, setRest] = useState<number | null>(0)
  const [filter, setFilter] = useState<CaseType | 'all'>('all')
  const [focusCase, setFocusCase] = useState<number | null>(null)
  const [hoverCase, setHoverCase] = useState<number | null>(null)
  const [dust, setDust] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [untied, setUntied] = useState(false)

  const copy = useMemo(() => buildCopy(t), [t])
  const cursor = useMemo(
    () => ({
      open: t('dp.catalog.open'),
      filter: t('dp.catalog.filter'),
      browse: t('dp.catalog.browse'),
      tie: t('dp.book.untie'),
      play: t('deadpan.play'),
      link: t('signal.action'),
      tabs: Object.fromEntries(TABS.map((tab) => [tab.id, `${tab.number} ${t(`dp.chapters.${tab.id}`)}`])) as Record<
        TabId,
        string
      >,
    }),
    [t],
  )
  const types = CASE_TYPES.filter((type) => CASE_ARCHIVE.some((item) => item.type === type))
  const order = useMemo(() => visibleCases(filter), [filter])

  const finishDust = useDeskDust({
    area: stageRef,
    dust: dustRef,
    motes: motesRef,
    enabled: true,
    fine,
    onProgress: setDust,
    onReveal: () => setRevealed(true),
  })

  const goTo = useCallback((target: number) => {
    if (section.current) scrollToSpread(section.current, target)
  }, [])

  /** 解扣：红线松落，封面掀开，书带到开卷目录。 */
  const untie = useCallback(() => {
    finishDust()
    setUntied(true)
    goTo(1)
  }, [finishDust, goTo])

  const openTab = useCallback(
    (tab: TabId) => {
      finishDust()
      setUntied(true)
      if (tab === 'open') goTo(1)
      else if (tab === 'deduce') goTo(3)
      else goTo(tab === 'ask' ? ASK_SPREAD : PAPER_SPREAD)
    },
    [finishDust, goTo],
  )

  // 舞台尺寸：叠层与批注要和书对齐
  useEffect(() => {
    const element = stageRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) =>
      setStage({ w: entry.contentRect.width, h: entry.contentRect.height }),
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // 鼠标视差：只写 CSS 变量，不走 React 渲染
  useEffect(() => {
    const element = stageRef.current
    if (!element || !fine) return
    const move = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect()
      element.style.setProperty('--mx', (((event.clientX - rect.left) / rect.width - 0.5) * 2).toFixed(3))
      element.style.setProperty('--my', (((event.clientY - rect.top) / rect.height - 0.5) * 2).toFixed(3))
    }
    element.addEventListener('pointermove', move)
    return () => element.removeEventListener('pointermove', move)
  }, [fine])

  // 滚动 → 书页进度；开始滚动就等于解扣
  useEffect(() => {
    const element = section.current
    if (!element) return
    let last = 0
    const apply = (value: number) => {
      const q = value * Q_MAX
      if (Math.abs(q - last) > 1) snap.current = true
      last = q
      progress.current = q
      if (q > 0.04) {
        finishDust()
        setUntied(true)
      }
      setSpread(spreadAt(q))
      invalidateRef.current?.()
    }
    const trigger = ScrollTrigger.create({
      trigger: element,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => apply(self.progress),
      onRefresh: (self) => apply(self.progress),
    })
    apply(trigger.progress)

    const onKey = (event: KeyboardEvent) => {
      if (!trigger.isActive || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
      const target = event.target
      if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]')) return
      if (event.key === 'ArrowRight') goTo(Math.min(END_SPREAD, spreadAt(progress.current) + 1))
      else if (event.key === 'ArrowLeft') goTo(Math.max(0, spreadAt(progress.current) - 1))
      else return
      event.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      trigger.kill()
    }
  }, [goTo, finishDust])

  const page = pageSize(stage.w, stage.h)
  const closed = spread === 0
  const end = spread === END_SPREAD
  const wide = closed || end
  const catalog = spread >= 1 && spread < BOARD_SPREAD
  const wall = spread === BOARD_SPREAD
  const asking = spread === ASK_SPREAD
  const paper = spread === PAPER_SPREAD
  const chapter = closed ? 'dust' : catalog ? 'open' : wall ? 'deduce' : asking ? 'ask' : paper ? 'publish' : 'end'
  const label = {
    dust: ['00', t('dp.chapters.dust')],
    open: ['01', `${t('dp.chapters.open')} / ${t('dp.catalog.title')}`],
    deduce: ['02', `${t('dp.chapters.deduce')} / ${t('deadpan.meta3')}`],
    ask: ['03', `${t('dp.chapters.ask')} / ${t('deadpan.meta1')}`],
    publish: ['04', `${t('dp.chapters.publish')} / ${t('dp.paper.masthead')}`],
    end: null,
  }[chapter]
  const hint = {
    dust: '',
    open: t('dp.book.scroll'),
    deduce: t('dp.board.hint'),
    ask: t('dp.ask.label'),
    publish: t('dp.paper.kicker'),
    end: '',
  }[chapter]
  /** 以 scale 放大的整幅跨页在舞台里的矩形；叠层都挂在这个矩形上。 */
  const spreadRect = (scale: number) => ({
    left: (stage.w - page.width * 2 * scale) / 2,
    top: (stage.h - page.height * scale) / 2,
    width: page.width * 2 * scale,
    height: page.height * scale,
  })

  const focusRow = (index: number) => {
    const face = caseFace(index, filter)
    setFocusCase(index)
    if (face) goTo(face === 'cat1' ? 2 : face === 'cat2' ? 2 : 3)
  }

  return (
    <section
      ref={section}
      aria-label={t('dp.book.label')}
      className='relative -mt-[72px]'
      style={{ height: `${SECTION_HEIGHT_SVH}svh` }}
    >
      <div
        ref={stageRef}
        className={cn('sticky top-0 h-svh touch-pan-y overflow-hidden select-none', fine && !revealed && 'cursor-none')}
        style={{ '--mx': 0, '--my': 0 } as CSSProperties}
      >
        <DeskDefs />
        <DeskBackdrop />

        {/* 桌面物件：随章节更换，按鼠标做分层视差 */}
        <div aria-hidden className='pointer-events-none absolute inset-0 z-[5]'>
          <CoffeeRing className='right-[27%] bottom-[8%] w-[9%]' />
          <Pencil shown className='bottom-[2.5%] left-[24%] w-[13%]' />
          <EvidenceTag shown={wide && revealed} className='top-[15%] left-[4%] w-[9.5%]' />
          <Clipping shown={wide && revealed} className='top-[6%] right-[2%] w-[16.5%]' />
          <IndexCard shown={wide && revealed} className='right-[2%] bottom-[5%] w-[19%]' />
          <Notepad shown={wide && revealed} className='bottom-[11%] left-[3.5%] w-[12.5%]' />
          <CardBox shown={catalog} className='bottom-[9%] left-[1.5%] w-[14%]' />
          <Magnifier shown={catalog} className='right-[2.5%] bottom-[7%] w-[7%]' />
          <EvidenceTag shown={wall} from='left' tilt={-7} className='top-[20%] left-[2.6%] w-[9%]' />
          <DeskThread shown={wall} />
          <Pushpin shown={wall} className='top-[21%] left-[5.6%]' />
          <Pushpin shown={wall} className='top-[56.2%] left-[18.3%]' />
          <Notepad shown={asking} className='bottom-[14%] left-[1.6%] w-[11%]' />
          <Inkwell shown={asking} className='right-[2%] bottom-[10%] w-[8%]' />
          <NewsStack shown={paper} className='bottom-[8%] left-[0.6%] w-[11.5%]' />
        </div>
        <EdgeDust shown={revealed} />

        <SceneBoundary onError={onFail}>
          <Suspense fallback={null}>
            <CaseBookScene
              progress={progress}
              snap={snap}
              invalidateRef={invalidateRef}
              copy={copy}
              filter={filter}
              focusCase={focusCase}
              untied={untied}
              cursor={cursor}
              onFilter={setFilter}
              onTab={openTab}
              onTie={untie}
              onHoverCase={setHoverCase}
              onRest={setRest}
            />
          </Suspense>
        </SceneBoundary>

        {/* 悬停某宗案卷：一张小卷宗卡从书页抽到桌上 */}
        <DeskDossier index={hoverCase} shown={catalog} className='top-[9%] right-[1%] z-[22] w-[12.5%]' />

        {/* 摊平的跨页上的叠层：线索墙的卡片与红线、盘问的讯问笔录输入（只在书停稳时可操作） */}
        {page.width > 0 ? (
          <div className='pointer-events-none absolute z-20' style={spreadRect(1)}>
            <ClueWall active={rest === BOARD_SPREAD} className='absolute inset-0' />
            <div className='pointer-events-none absolute top-0 right-0 h-full w-1/2'>
              <AskRecord active={rest === ASK_SPREAD} />
            </div>
          </div>
        ) : null}

        {/* 见报：「已刊」章盖在头版右页上（镜头拉升后的跨页） */}
        {page.width > 0 && rest === PAPER_SPREAD ? (
          <div className='@container pointer-events-none absolute z-20' style={spreadRect(SHOT.paper)}>
            <div
              aria-hidden
              className='absolute right-[4.5%] bottom-[6%] animate-in border-[.4cqw] border-[#842219] px-[1.4cqw] py-[.5cqw] font-serif-sc text-[3cqw] font-black tracking-[.24em] text-[#842219] opacity-90 mix-blend-multiply duration-500 fade-in zoom-in-[2.6]'
              style={{ rotate: '-9deg' }}
            >
              {t('dp.paper.stamp')}
            </div>
          </div>
        ) : null}

        <SpreadNote spread={spread} rest={rest} />
        <FinaleOverlay shown={rest === END_SPREAD} />

        <TabNotes stage={stage} shown={closed && revealed} />

        <canvas ref={dustRef} aria-hidden className='pointer-events-none absolute inset-0 z-40 size-full' />
        <canvas ref={motesRef} aria-hidden className='pointer-events-none absolute inset-0 z-40 size-full' />

        <div className='pointer-events-none absolute inset-x-0 top-[clamp(4.6rem,9svh,5.6rem)] z-50 px-[clamp(1.25rem,4vw,4.5rem)]'>
          {label ? <SectionLabel key={chapter} index={label[0]} label={label[1]} /> : null}
        </div>

        <div className='pointer-events-none absolute inset-x-0 bottom-[clamp(1rem,3.2svh,2rem)] z-50 flex items-center justify-between gap-4 px-[clamp(1.25rem,4vw,4.5rem)]'>
          <p
            className='hidden w-72 items-center gap-3 font-mono text-[.64rem] tracking-[.18em] text-[#ecdcbc]/75 uppercase lg:flex'
            aria-live='polite'
          >
            {hint || closed ? (
              <span aria-hidden className={cn('size-1.5 bg-accent', closed && 'animate-pulse')} />
            ) : null}
            {closed ? (
              revealed ? (
                t('dp.book.openHint')
              ) : (
                <>
                  {t('dp.hero.hint')}
                  <span className='tabular-nums'>
                    {Math.round((Math.min(dust, DUST_REVEAL_AT) / DUST_REVEAL_AT) * 100)}%
                  </span>
                </>
              )
            ) : (
              hint
            )}
          </p>
          <div className='flex items-center gap-4'>
            <button type='button' className={navButton} disabled={spread <= 0} onClick={() => goTo(spread - 1)}>
              <ArrowLeft aria-hidden className='size-3.5' />
              {t('dp.book.prev')}
            </button>
            <span className='min-w-28 text-center font-mono text-[.66rem] tracking-[.18em] text-[#ecdcbc]/75 tabular-nums'>
              {t('dp.book.spread', { n: spread + 1, total: SPREADS })}
            </span>
            <button
              type='button'
              className={navButton}
              disabled={spread >= END_SPREAD}
              onClick={() => (closed ? untie() : goTo(spread + 1))}
            >
              {t('dp.book.next')}
              <ArrowRight aria-hidden className='size-3.5' />
            </button>
          </div>
          <span aria-hidden className='hidden w-72 lg:block' />
        </div>

        {/* 读屏与键盘：书里的内容在这里有一份真实的 DOM */}
        <div className='sr-only'>
          <h1 id='dp-hero-title' tabIndex={-1}>
            {t('deadpan.name')} · {t('deadpan.english')}
          </h1>
          {closed ? (
            <button type='button' onClick={untie}>
              {t('dp.book.untie')}
            </button>
          ) : null}
          <nav aria-label={t('dp.book.label')}>
            {TABS.map((tab) => (
              <button key={tab.id} type='button' onClick={() => openTab(tab.id)}>
                {tab.number} {t(`dp.chapters.${tab.id}`)}
              </button>
            ))}
          </nav>
          <h2 id='dp-catalog-title' data-book-spread={1} tabIndex={-1}>
            {t('dp.catalog.title')}
          </h2>
          <p>{t('dp.catalog.note')}</p>
          <fieldset>
            <legend>{t('dp.catalog.filter')}</legend>
            {(['all', ...types] as const).map((type) => (
              <button
                key={type}
                type='button'
                aria-pressed={filter === type}
                onClick={() => setFilter(type)}
                onFocus={() => goTo(1)}
              >
                {type === 'all' ? t('dp.catalog.all') : t(`dp.types.${type}`)}
              </button>
            ))}
          </fieldset>
          <ul>
            {order.map((index) => {
              const item = CASE_ARCHIVE[index]
              return (
                <li key={item.name}>
                  <a
                    href={CATALOG_URL}
                    target='_blank'
                    rel='noreferrer'
                    onFocus={() => focusRow(index)}
                    onBlur={() => setFocusCase(null)}
                  >
                    {item.name}，{t(`dp.types.${item.type}`)}，{t(`dp.levels.${item.level}`)}，
                    {item.edition === 'zh' ? t('dp.catalog.editionZh') : t('dp.catalog.editionEn')}
                    <span className='sr-only'>{t('a11y.external')}</span>
                  </a>
                </li>
              )
            })}
          </ul>
          <a href={CATALOG_URL} target='_blank' rel='noreferrer'>
            {t('dp.catalog.browse')}
            <span className='sr-only'>{t('a11y.external')}</span>
          </a>
          <h2 id='dp-board-title' data-book-spread={BOARD_SPREAD} tabIndex={-1}>
            {t('pillars.twoTitle')}
          </h2>
          <p>{t('pillars.twoBody')}</p>
          <h2 id='dp-ask-title' tabIndex={-1}>
            {t('pillars.oneTitle')}
          </h2>
          <p>{t('pillars.oneBody')}</p>
          <h2 id='dp-paper-title' tabIndex={-1}>
            {t('signal.title')}
          </h2>
          <p>{t('signal.body')}</p>
          <ol>
            {(['part1', 'part2', 'part3', 'part4', 'part5', 'part6'] as const).map((key) => (
              <li key={key}>{t(`dp.paper.${key}`)}</li>
            ))}
          </ol>
          <p id='dp-finale-title'>{t('dp.finale.line')}</p>
          <a href={DEADPAN_URL} target='_blank' rel='noreferrer'>
            {t('deadpan.play')}
            <span className='sr-only'>{t('a11y.external')}</span>
          </a>
        </div>
      </div>
    </section>
  )
}

/**
 * 积案拂尘页的首屏、开卷与推理：宽屏下是同一本书（案卷册）躺在积灰的桌上，拂尘、解扣后翻阅；
 * 窄屏、减少动态效果或无 WebGL 时回到调查桌首屏加两段竖排区块。
 */
export function DeadpanCaseBook() {
  const wide = useMediaQuery(BOOK_VIEWPORT)
  const reduced = useReducedMotion()
  const webgl = useMemo(supportsWebGL, [])
  const [failed, setFailed] = useState(false)
  const book = wide && !reduced && webgl && !failed

  // 两种形态高度不同，切换后重新计算滚动触发点
  // biome-ignore lint/correctness/useExhaustiveDependencies: book 只是触发重算的信号
  useEffect(() => {
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(frame)
  }, [book])

  if (!book) {
    return (
      <>
        <DeadpanHero />
        <DeadpanCatalog />
        <DeadpanBoard />
        <DeadpanAsk />
        <DeadpanPaper />
        <DeadpanFinale />
        <DeskTravel />
      </>
    )
  }
  return <CaseBookSection onFail={() => setFailed(true)} />
}
