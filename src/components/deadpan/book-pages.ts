import type { TFunction } from 'i18next'
import finePaperUrl from '@/assets/textures/fine-paper.webp'
import cardboardUrl from '@/assets/textures/folder-cardboard.webp'
import { usePreferencesStore } from '@/stores/preferences-store'

import { type ArchivedCase, CASE_ARCHIVE, CASE_LEVELS, CASE_TYPES, type CaseLevel, type CaseType } from './case-archive'

/** 页面设计坐标：所有绘制都以这套单位为准，贴图按 TEX_SCALE 放大。 */
export const PAGE_W = 512
export const PAGE_H = 724
/** 封面比内页大一圈：自由边多 12，上下各多 8。 */
export const COVER_W = 524
export const COVER_H = 740
export const COVER_OVERHANG = { x: 12, y: 8 }
/** 索引标签：纸张自由边外多出的一条。 */
export const TAB_W = 38
export const TAB_H = 104
export const TEX_SCALE = 1.5
export const PER_PAGE = 5

export type FaceId =
  | 'cover'
  | 'frontis'
  | 'preface'
  | 'cat1'
  | 'cat2'
  | 'cat3'
  | 'foreword'
  | 'wallL'
  | 'wallR'
  | 'askL'
  | 'askR'
  | 'paperL'
  | 'paperR'
  | 'end'
  | 'back'

export const FACE_IDS: FaceId[] = [
  'cover',
  'frontis',
  'preface',
  'cat1',
  'cat2',
  'cat3',
  'foreword',
  'wallL',
  'wallR',
  'askL',
  'askR',
  'paperL',
  'paperR',
  'end',
  'back',
]
export const CATALOG_FACES: FaceId[] = ['cat1', 'cat2', 'cat3']
/** 铺在纸背面的面：翻到左边后才被看到，贴图水平镜像。 */
export const MIRRORED_FACES: FaceId[] = ['frontis', 'cat1', 'cat3', 'wallL', 'askL', 'paperL', 'end']
/** 封面尺寸的面（比内页大一圈，没有索引标签）。 */
const COVER_SIZED: FaceId[] = ['cover', 'frontis', 'back']

export const FACE_SIZE = Object.fromEntries(
  FACE_IDS.map((id) => [id, COVER_SIZED.includes(id) ? { w: COVER_W, h: COVER_H } : { w: PAGE_W + TAB_W, h: PAGE_H }]),
) as Record<FaceId, { w: number; h: number }>

/** 这个面所在的纸页是否带索引标签区（封面尺寸的面没有）。 */
export const hasTabZone = (face: FaceId) => !COVER_SIZED.includes(face)

/** 页内容在画布里的起点：翻到左边的面，索引标签在画布左侧，内容右移 TAB_W。 */
export const faceOrigin = (face: FaceId) => (MIRRORED_FACES.includes(face) && !COVER_SIZED.includes(face) ? TAB_W : 0)

export type TabId = 'open' | 'deduce' | 'ask' | 'publish'

/** 索引标签：同一张纸的正反面各画一次；y 是标签顶边在页内的位置。 */
export const TABS: { id: TabId; number: string; y: number; faces: FaceId[] }[] = [
  { id: 'open', number: '01', y: 92, faces: ['preface', 'cat1'] },
  { id: 'deduce', number: '02', y: 230, faces: ['foreword', 'wallL'] },
  { id: 'ask', number: '03', y: 368, faces: ['wallR', 'askL'] },
  { id: 'publish', number: '04', y: 506, faces: ['askR', 'paperL'] },
]

export type Region = {
  x: number
  y: number
  w: number
  h: number
  kind: 'case' | 'filter' | 'browse' | 'tab' | 'tie' | 'play' | 'link'
  /** case：CASE_ARCHIVE 下标；filter：案型或 'all'；tab：章节。 */
  id: number | CaseType | 'all' | TabId
}

export type BookCopy = {
  catalogTitle: string
  catalogNote: string
  filterLabel: string
  all: string
  browse: string
  office: string
  motto: string
  wallTitle: string
  wallHint: string
  stamp: string
  register: string
  preface: string
  legend: string
  title: string
  english: string
  contents: string
  deadpanLabel: string
  description: string
  features: string[]
  status: string
  play: string
  foreTitle: string
  foreBody: string
  foreNext: string
  clueLabel: string
  clues: string[]
  tabs: Record<TabId, string>
  zh: boolean
  date: string
  askTitle: string
  askBody: string
  askMeta: string
  askRecord: string
  mast: string
  paperLeft: string
  paperRight: string
  kicker: string
  headline: string
  signalBody: string
  signalLabel: string
  signalAction: string
  parts: string[]
  partsLabel: string
  quoteTitle: string
  quoteBody: string
  count: (count: number) => string
  page: (page: number) => string
  editionZh: string
  editionEn: string
  types: Record<CaseType, string>
  levels: Record<CaseLevel, string>
}

export function buildCopy(t: TFunction): BookCopy {
  const locale = usePreferencesStore.getState().locale
  const zh = locale === 'zh-CN'
  return {
    zh,
    date: new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(
      new Date(),
    ),
    askTitle: t('pillars.oneTitle'),
    askBody: t('pillars.oneBody'),
    askMeta: t('deadpan.meta1'),
    askRecord: t('dp.ask.record'),
    mast: t('dp.paper.masthead'),
    paperLeft: t('dp.paper.left'),
    paperRight: t('dp.paper.right'),
    kicker: t('dp.paper.kicker'),
    headline: t('signal.title'),
    signalBody: t('signal.body'),
    signalLabel: `${t('signal.label')} · ${t('signal.date')}`,
    signalAction: t('signal.action'),
    parts: ['part1', 'part2', 'part3', 'part4', 'part5', 'part6'].map((key) => t(`dp.paper.${key}`)),
    partsLabel: t('dp.paper.parts'),
    quoteTitle: zh ? `「${t('pillars.threeTitle')}」` : `“${t('pillars.threeTitle')}”`,
    quoteBody: t('pillars.threeBody'),
    catalogTitle: t('dp.catalog.title'),
    catalogNote: t('dp.catalog.note'),
    filterLabel: t('dp.catalog.filter'),
    all: t('dp.catalog.all'),
    browse: t('dp.catalog.browse'),
    office: t('dp.hero.office'),
    motto: t('dp.hero.motto'),
    wallTitle: t('dp.book.wall'),
    wallHint: t('dp.board.hint'),
    stamp: t('dp.book.stamp'),
    register: t('dp.book.register'),
    preface: t('dp.book.preface'),
    legend: t('dp.book.legend'),
    title: t('deadpan.name'),
    english: t('deadpan.english'),
    contents: t('dp.desk.contents'),
    deadpanLabel: t('deadpan.label'),
    description: t('deadpan.description'),
    features: [t('deadpan.meta1'), t('deadpan.meta2'), t('deadpan.meta3')],
    status: t('deadpan.status'),
    play: t('deadpan.play'),
    foreTitle: t('pillars.twoTitle'),
    foreBody: t('pillars.twoBody'),
    foreNext: t('dp.book.foreNext'),
    clueLabel: t('dp.desk.clues'),
    clues: [t('dp.board.contradiction'), t('dp.board.omission'), t('dp.board.crease')],
    tabs: {
      open: t('dp.chapters.open'),
      deduce: t('dp.chapters.deduce'),
      ask: t('dp.chapters.ask'),
      publish: t('dp.chapters.publish'),
    },
    count: (count) => t('dp.book.count', { count }),
    page: (page) => t('dp.book.page', { n: page }),
    editionZh: t('dp.catalog.editionZh'),
    editionEn: t('dp.catalog.editionEn'),
    types: Object.fromEntries(CASE_TYPES.map((type) => [type, t(`dp.types.${type}`)])) as Record<CaseType, string>,
    levels: Object.fromEntries(CASE_LEVELS.map((level) => [level, t(`dp.levels.${level}`)])) as Record<
      CaseLevel,
      string
    >,
  }
}

export type PaintState = {
  copy: BookCopy
  filter: CaseType | 'all'
  /** 高亮的案卷（CASE_ARCHIVE 下标）。 */
  hover: number | null
  /** 封面的绕线扣是否已解开。 */
  untied: boolean
}

export type BookAssets = { paper: HTMLImageElement; board: HTMLImageElement }

const SERIF = '"Noto Serif SC Variable","Noto Serif SC",serif'
const HEAD = '"Playfair Display Variable","Noto Serif SC Variable",serif'
const MONO = '"JetBrains Mono Variable",ui-monospace,monospace'
const HAND = '"Caveat Variable","Long Cang",cursive'

const INK = '#17120d'
const RED = '#842219'
const PEN = '#b8321f'
const PAPER = '#e6cfaa'

type Ctx = CanvasRenderingContext2D
type Rect = { x: number; y: number; w: number; h: number }

/** 案卷名在列表中的可见顺序（受案型筛选影响）。 */
export function visibleCases(filter: CaseType | 'all') {
  const list: number[] = []
  CASE_ARCHIVE.forEach((item, index) => {
    if (filter === 'all' || item.type === filter) list.push(index)
  })
  return list
}

/** 某宗案卷当前印在哪一页；被筛掉时为 null。 */
export function caseFace(caseIndex: number, filter: CaseType | 'all'): FaceId | null {
  const order = visibleCases(filter).indexOf(caseIndex)
  return order < 0 ? null : (CATALOG_FACES[Math.floor(order / PER_PAGE)] ?? null)
}

const flatten = (value: unknown): string[] => {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(flatten)
  if (value && typeof value === 'object') return Object.values(value).flatMap(flatten)
  return []
}

/** 绘制用到的字体与图片，全部就绪后才开始画，避免贴图里出现回退字体。 */
export async function loadBookAssets(copy: BookCopy): Promise<BookAssets> {
  const sample = [...flatten(copy), ...CASE_ARCHIVE.map((item) => item.name), '0123456789N°·—↗'].join('')
  const image = async (url: string) => {
    const element = new Image()
    element.src = url
    await element.decode()
    return element
  }
  const [paper, board] = await Promise.all([
    image(finePaperUrl),
    image(cardboardUrl),
    ...[
      `900 64px ${SERIF}`,
      `700 30px ${SERIF}`,
      `500 16px ${SERIF}`,
      `400 14px ${SERIF}`,
      `700 30px ${HEAD}`,
      `900 50px ${HEAD}`,
      `500 12px ${MONO}`,
      `400 30px ${HAND}`,
    ].map((font) => document.fonts.load(font, sample)),
  ])
  return { paper, board }
}

/** 每个面的画布尺寸（像素）。 */
export function faceCanvasSize(face: FaceId) {
  const { w, h } = FACE_SIZE[face]
  return { width: Math.round(w * TEX_SCALE), height: Math.round(h * TEX_SCALE) }
}

/** 一个面的点击区域，用于悬停与点击。 */
export function hitRegion(regions: Region[], x: number, y: number) {
  return regions.find(
    (region) => x >= region.x && x <= region.x + region.w && y >= region.y && y <= region.y + region.h,
  )
}

/* ------------------------------------------------------------------ 绘制工具 */

function seeded(seed: number) {
  let value = seed
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296
    return value / 4294967296
  }
}

function tile(ctx: Ctx, image: HTMLImageElement, rect: Rect, size: number) {
  const height = (size * image.naturalHeight) / image.naturalWidth
  for (let y = rect.y; y < rect.y + rect.h; y += height) {
    for (let x = rect.x; x < rect.x + rect.w; x += size) ctx.drawImage(image, x, y, size, height)
  }
}

function font(weight: number, size: number, family: string) {
  return `${weight} ${size}px ${family}`
}

function text(
  ctx: Ctx,
  value: string,
  x: number,
  y: number,
  options: { font: string; color: string; align?: CanvasTextAlign; spacing?: number; alpha?: number },
) {
  ctx.save()
  ctx.font = options.font
  ctx.fillStyle = options.color
  ctx.textAlign = options.align ?? 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.globalAlpha = options.alpha ?? 1
  ctx.letterSpacing = `${options.spacing ?? 0}px`
  ctx.fillText(value, x, y)
  ctx.restore()
}

function measure(ctx: Ctx, value: string, fontSpec: string, spacing = 0) {
  ctx.save()
  ctx.font = fontSpec
  ctx.letterSpacing = `${spacing}px`
  const width = ctx.measureText(value).width
  ctx.restore()
  return width
}

/** 缩小字号直到放进给定宽度。 */
function fitSize(
  ctx: Ctx,
  value: string,
  maxWidth: number,
  make: (size: number) => string,
  start: number,
  min = 10,
  spacing = 0,
) {
  let size = start
  while (size > min && measure(ctx, value, make(size), spacing) > maxWidth) size -= 1
  return size
}

function wrap(ctx: Ctx, value: string, maxWidth: number, fontSpec: string) {
  const tokens = value.match(/[　-鿿＀-￯]|\s+|[^\s　-鿿＀-￯]+/g) ?? []
  const lines: string[] = []
  let line = ''
  for (const token of tokens) {
    const attempt = line + token
    // 句末标点不能落到行首：宁可让这一行略微超出
    const closing = /^[，。、；：！？）」』”’…,.;:!?)]$/.test(token)
    if (line && !closing && measure(ctx, attempt, fontSpec) > maxWidth) {
      lines.push(line.trimEnd())
      line = token.trimStart()
    } else line = attempt
  }
  if (line.trim()) lines.push(line.trim())
  return lines
}

function levelMarks(ctx: Ctx, level: CaseLevel, x: number, y: number, color: string) {
  const rank = CASE_LEVELS.indexOf(level)
  CASE_LEVELS.forEach((_, index) => {
    ctx.fillStyle = color
    ctx.globalAlpha = index <= rank ? 0.9 : 0.2
    ctx.fillRect(x + index * 10, y, 7, 7)
  })
  ctx.globalAlpha = 1
  return CASE_LEVELS.length * 10 - 3
}

function doubleRule(ctx: Ctx, x1: number, x2: number, y: number, color = INK) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x1, y)
  ctx.lineTo(x2, y)
  ctx.stroke()
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.moveTo(x1, y + 4)
  ctx.lineTo(x2, y + 4)
  ctx.stroke()
  ctx.restore()
}

/** 内页的纸：新闻纸色、真实纸纹、受光斑、边缘磨损与书脊暗部。spine 是装订边所在的一侧。 */
function paperBase(ctx: Ctx, rect: Rect, assets: BookAssets, spine: 'left' | 'right') {
  const { x, y, w, h } = rect
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.fillStyle = PAPER
  ctx.fillRect(x, y, w, h)
  ctx.globalCompositeOperation = 'multiply'
  ctx.globalAlpha = 0.9
  tile(ctx, assets.paper, rect, 360)
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1

  const blotch = (cx: number, cy: number, radius: number, color: string) => {
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
    gradient.addColorStop(0, color)
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(x, y, w, h)
  }
  blotch(x + w * 0.18, y + h * 0.22, w * 0.7, 'rgba(122,84,40,.16)')
  blotch(x + w * 0.82, y + h * 0.78, w * 0.8, 'rgba(122,84,40,.2)')
  blotch(x + w * 0.5, y + h * 0.5, w * 0.9, 'rgba(255,248,230,.28)')

  ctx.fillStyle = 'rgba(55,40,24,.03)'
  for (let line = y; line < y + h; line += 6) ctx.fillRect(x, line, w, 1)

  // 四边磨损
  const wear = (x1: number, y1: number, x2: number, y2: number, rx: number, ry: number, rw: number, rh: number) => {
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
    gradient.addColorStop(0, 'rgba(110,76,36,.3)')
    gradient.addColorStop(1, 'rgba(110,76,36,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(rx, ry, rw, rh)
  }
  wear(x, y, x, y + 14, x, y, w, 14)
  wear(x, y + h, x, y + h - 22, x, y + h - 22, w, 22)
  const outer = spine === 'left' ? x + w : x
  wear(outer, y, outer + (spine === 'left' ? -12 : 12), y, spine === 'left' ? x + w - 12 : x, y, 12, h)

  // 书脊暗部
  const gx = spine === 'left' ? x : x + w
  const dir = spine === 'left' ? 1 : -1
  const gutter = ctx.createLinearGradient(gx, 0, gx + dir * 78, 0)
  gutter.addColorStop(0, 'rgba(38,22,8,.62)')
  gutter.addColorStop(0.12, 'rgba(48,28,10,.34)')
  gutter.addColorStop(0.45, 'rgba(60,38,18,.1)')
  gutter.addColorStop(1, 'rgba(60,38,18,0)')
  ctx.fillStyle = gutter
  ctx.fillRect(spine === 'left' ? x : x + w - 78, y, 78, h)
  ctx.restore()
}

/** 牛皮纸硬壳。 */
function kraftBase(ctx: Ctx, w: number, h: number, assets: BookAssets) {
  ctx.fillStyle = '#a98c60'
  ctx.fillRect(0, 0, w, h)
  ctx.globalCompositeOperation = 'multiply'
  ctx.globalAlpha = 0.95
  tile(ctx, assets.board, { x: 0, y: 0, w, h }, 380)
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  const gradient = ctx.createRadialGradient(w * 0.5, h * 0.42, h * 0.1, w * 0.5, h * 0.5, h * 0.8)
  gradient.addColorStop(0, 'rgba(255,232,184,.18)')
  gradient.addColorStop(1, 'rgba(40,24,8,.46)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)
  // 手摸发暗的边
  ctx.strokeStyle = 'rgba(36,20,6,.3)'
  ctx.lineWidth = 3
  ctx.strokeRect(1.5, 1.5, w - 3, h - 3)
}

/* ------------------------------------------------------------------ 各个面 */

const ROW_TOP = 82
const ROW_H = 113

/** 红笔画的对勾。 */
function penTick(ctx: Ctx, x: number, y: number, size: number) {
  ctx.save()
  ctx.strokeStyle = PEN
  ctx.lineWidth = 2.2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(x + size * 0.12, y + size * 0.55)
  ctx.lineTo(x + size * 0.42, y + size * 0.88)
  ctx.lineTo(x + size * 1.0, y - size * 0.1)
  ctx.stroke()
  ctx.restore()
}

/** 封面：牛皮纸硬壳、红布书脊、标签、机密章与绕线扣。 */
function paintCover(ctx: Ctx, assets: BookAssets, copy: BookCopy, untied: boolean): Region[] {
  const w = COVER_W
  const h = COVER_H
  kraftBase(ctx, w, h, assets)

  // 咖啡杯印
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.strokeStyle = 'rgba(70,38,12,.22)'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(330, 548, 64, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(70,38,12,.12)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(331, 549, 58, 0.4, Math.PI * 1.7)
  ctx.stroke()
  ctx.restore()

  // 书脊红布条与缝线
  const cloth = ctx.createLinearGradient(0, 0, 40, 0)
  cloth.addColorStop(0, '#4d130d')
  cloth.addColorStop(0.7, '#78241a')
  cloth.addColorStop(1, '#5a1a11')
  ctx.fillStyle = cloth
  ctx.fillRect(0, 0, 40, h)
  ctx.fillStyle = 'rgba(0,0,0,.16)'
  for (let i = 0; i < 40; i += 2) ctx.fillRect(i, 0, 1, h)
  for (let j = 0; j < h; j += 2) ctx.fillRect(0, j, 40, 1)
  ctx.fillStyle = 'rgba(0,0,0,.45)'
  ctx.fillRect(40, 0, 2.5, h)
  ctx.fillStyle = 'rgba(255,230,190,.28)'
  ctx.fillRect(43, 0, 1.2, h)
  ctx.save()
  ctx.strokeStyle = 'rgba(236,220,188,.55)'
  ctx.lineWidth = 1.4
  ctx.setLineDash([7, 6])
  ctx.beginPath()
  ctx.moveTo(52, 18)
  ctx.lineTo(52, h - 18)
  ctx.stroke()
  ctx.restore()

  // 手写编号
  ctx.save()
  ctx.translate(92, 112)
  ctx.rotate(-0.06)
  text(ctx, 'N°001', 0, 0, { font: font(400, 40, HAND), color: INK, alpha: 0.72 })
  ctx.restore()

  // 标签贴
  const label = { x: 88, y: 138, w: 392, h: 262 }
  ctx.save()
  ctx.shadowColor = 'rgba(30,16,4,.45)'
  ctx.shadowBlur = 12
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 5
  ctx.fillStyle = '#efe4cb'
  ctx.beginPath()
  ctx.moveTo(label.x, label.y)
  ctx.lineTo(label.x + label.w - 26, label.y)
  ctx.lineTo(label.x + label.w, label.y + 26)
  ctx.lineTo(label.x + label.w, label.y + label.h)
  ctx.lineTo(label.x, label.y + label.h)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
  ctx.save()
  ctx.beginPath()
  ctx.rect(label.x, label.y, label.w, label.h)
  ctx.clip()
  ctx.globalCompositeOperation = 'multiply'
  tile(ctx, assets.paper, label, 300)
  ctx.restore()
  // 折角
  ctx.fillStyle = '#e1d4b6'
  ctx.beginPath()
  ctx.moveTo(label.x + label.w - 26, label.y)
  ctx.lineTo(label.x + label.w, label.y + 26)
  ctx.lineTo(label.x + label.w - 26, label.y + 26)
  ctx.closePath()
  ctx.fill()

  const cx = label.x + label.w / 2
  const innerWidth = label.w - 76
  const officeSize = fitSize(ctx, copy.office, innerWidth, (size) => font(500, size, SERIF), 14, 9, 3)
  text(ctx, copy.office, cx, label.y + 46, {
    font: font(500, officeSize, SERIF),
    color: INK,
    align: 'center',
    spacing: 3,
    alpha: 0.78,
  })
  ctx.fillStyle = 'rgba(23,18,13,.7)'
  ctx.fillRect(label.x + 36, label.y + 60, label.w - 72, 1.4)
  const titleSize = fitSize(ctx, copy.title, innerWidth, (size) => font(900, size, SERIF), 76, 30, 4)
  text(ctx, copy.title, cx, label.y + 138, {
    font: font(900, titleSize, SERIF),
    color: INK,
    align: 'center',
    spacing: 4,
  })
  text(ctx, copy.english.toUpperCase(), cx, label.y + 178, {
    font: font(500, 15, MONO),
    color: INK,
    align: 'center',
    spacing: 9,
    alpha: 0.8,
  })
  doubleRule(ctx, label.x + 36, label.x + label.w - 36, label.y + 198, 'rgba(23,18,13,.75)')
  text(ctx, 'CASE FILE 001—2026', cx, label.y + 238, {
    font: font(600, 11, MONO),
    color: INK,
    align: 'center',
    spacing: 4,
    alpha: 0.65,
  })

  text(ctx, 'MMSTUDIO', 52 + (w - 52) / 2, h - 34, {
    font: font(600, 11, MONO),
    color: '#f3e6c8',
    align: 'center',
    spacing: 7,
    alpha: 0.5,
  })

  // 机密章：先画在单独的画布上，再打出缺墨的斑点，最后正片叠底盖到封面上
  const stamp = document.createElement('canvas')
  stamp.width = 300
  stamp.height = 150
  const stampCtx = stamp.getContext('2d')
  if (stampCtx) {
    const size = fitSize(stampCtx, copy.stamp, 214, (value) => font(900, value, SERIF), 52, 20, 6)
    stampCtx.strokeStyle = '#8e2016'
    stampCtx.lineWidth = 6
    stampCtx.strokeRect(14, 14, 272, 122)
    stampCtx.lineWidth = 1.6
    stampCtx.strokeRect(24, 24, 252, 102)
    stampCtx.fillStyle = '#8e2016'
    stampCtx.textAlign = 'center'
    stampCtx.textBaseline = 'middle'
    stampCtx.font = font(900, size, SERIF)
    stampCtx.letterSpacing = '6px'
    stampCtx.fillText(copy.stamp, 150, 77)
    stampCtx.globalCompositeOperation = 'destination-out'
    const random = seeded(7)
    for (let i = 0; i < 420; i++) {
      stampCtx.globalAlpha = 0.35 + random() * 0.65
      const radius = 0.6 + random() * 2.2
      stampCtx.beginPath()
      stampCtx.arc(random() * 300, random() * 150, radius, 0, Math.PI * 2)
      stampCtx.fill()
    }
    ctx.save()
    ctx.translate(196, 560)
    ctx.rotate(-0.15)
    ctx.globalCompositeOperation = 'multiply'
    ctx.globalAlpha = 0.9
    ctx.scale(0.72, 0.72)
    ctx.drawImage(stamp, -150, -75)
    ctx.restore()
  }

  // 绕线扣：纸垫 + 黄铜垫片，红线绕几圈；解开后红线松落
  const washerX = 452
  const topY = 520
  const bottomY = 596
  const washer = (y: number) => {
    ctx.fillStyle = '#b8915d'
    ctx.beginPath()
    ctx.arc(washerX, y, 17, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#7a5a30'
    ctx.lineWidth = 1
    ctx.stroke()
    const brass = ctx.createRadialGradient(washerX - 3, y - 3, 1, washerX, y, 11)
    brass.addColorStop(0, '#f6e3b0')
    brass.addColorStop(0.5, '#b8914c')
    brass.addColorStop(1, '#5e4520')
    ctx.fillStyle = brass
    ctx.beginPath()
    ctx.arc(washerX, y, 10.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#3a2a12'
    ctx.beginPath()
    ctx.arc(washerX, y, 2.6, 0, Math.PI * 2)
    ctx.fill()
  }
  washer(topY)
  washer(bottomY)
  const twine = (draw: () => void) => {
    ctx.save()
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#6e2014'
    ctx.lineWidth = 3
    ctx.beginPath()
    draw()
    ctx.stroke()
    ctx.strokeStyle = 'rgba(255,170,140,.45)'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 3])
    ctx.beginPath()
    draw()
    ctx.stroke()
    ctx.restore()
  }
  if (untied) {
    twine(() => {
      ctx.moveTo(washerX, topY)
      ctx.bezierCurveTo(washerX + 26, topY + 30, washerX - 38, topY + 70, washerX - 20, topY + 118)
      ctx.bezierCurveTo(washerX - 12, topY + 140, washerX + 4, topY + 150, washerX - 6, topY + 168)
    })
  } else {
    twine(() => {
      ctx.moveTo(washerX, topY)
      ctx.bezierCurveTo(washerX + 26, topY + 22, washerX - 26, topY + 54, washerX, bottomY)
      ctx.bezierCurveTo(washerX + 26, bottomY - 22, washerX - 26, topY + 22, washerX, topY)
      ctx.bezierCurveTo(washerX + 28, topY + 28, washerX - 28, bottomY - 30, washerX, bottomY)
      ctx.bezierCurveTo(washerX + 16, bottomY + 24, washerX + 12, bottomY + 44, washerX + 6, bottomY + 58)
    })
  }
  return [{ x: washerX - 34, y: topY - 28, w: 68, h: bottomY - topY + 100, kind: 'tie', id: 'all' }]
}

/** 封里：开卷目录（原案卷夹内页）。左页，自由边在左，装订边在右。 */
function paintFrontis(ctx: Ctx, assets: BookAssets, state: PaintState): Region[] {
  const { copy } = state
  const regions: Region[] = []
  kraftBase(ctx, COVER_W, COVER_H, assets)
  const origin = COVER_OVERHANG
  paperBase(ctx, { x: origin.x, y: origin.y, w: PAGE_W, h: PAGE_H }, assets, 'right')
  ctx.save()
  ctx.translate(origin.x, origin.y)

  const left = 44
  const right = PAGE_W - 66
  const width = right - left
  text(ctx, copy.contents, left, 56, { font: font(700, 26, SERIF), color: INK, spacing: 5 })
  text(ctx, 'CASE 001', right, 54, { font: font(500, 10, MONO), color: INK, align: 'right', spacing: 3 })
  doubleRule(ctx, left, right, 72)
  text(ctx, copy.deadpanLabel.toUpperCase(), left, 112, {
    font: font(500, 10.5, MONO),
    color: RED,
    spacing: 3,
  })

  const bodyFont = font(400, 15.5, SERIF)
  wrap(ctx, copy.description, width, bodyFont).forEach((line, index) => {
    text(ctx, line, left, 154 + index * 29, { font: bodyFont, color: INK, alpha: 0.88 })
  })

  const featuresTop = 400
  ctx.fillStyle = 'rgba(23,18,13,.25)'
  ctx.fillRect(left, featuresTop, width, 1)
  copy.features.forEach((feature, index) => {
    const y = featuresTop + 40 + index * 52
    ctx.strokeStyle = 'rgba(23,18,13,.5)'
    ctx.lineWidth = 1.2
    ctx.strokeRect(left + 0.6, y - 17.4, 20, 20)
    penTick(ctx, left + 3, y - 12, 15)
    text(ctx, feature, left + 36, y, { font: font(600, 16, SERIF), color: INK, alpha: 0.9 })
    ctx.fillStyle = 'rgba(23,18,13,.25)'
    ctx.fillRect(left, y + 18, width, 1)
  })

  // 状态
  ctx.fillStyle = RED
  ctx.fillRect(left, 592, 7, 7)
  text(ctx, copy.status.toUpperCase(), left + 18, 600, {
    font: font(500, 10.5, MONO),
    color: INK,
    spacing: 2.5,
    alpha: 0.8,
  })

  // 进入游戏
  const label = `${copy.play}  ↗`
  const buttonFont = font(700, 14, SERIF)
  const buttonWidth = measure(ctx, label, buttonFont, 2) + 44
  ctx.fillStyle = INK
  ctx.fillRect(left, 626, buttonWidth, 40)
  text(ctx, label, left + 22, 652, { font: buttonFont, color: '#f7efdc', spacing: 2 })
  regions.push({ x: left + origin.x, y: 626 + origin.y, w: buttonWidth, h: 40, kind: 'play', id: 'all' })

  text(ctx, 'CASE FILE 001—2026', left + width / 2, 704, {
    font: font(500, 9.5, MONO),
    color: INK,
    align: 'center',
    spacing: 3,
    alpha: 0.45,
  })
  ctx.restore()
  return regions
}

/** 推理卷首：右页，装订边在左。标题、说明、证物牌上的三条线索，以及一笔红笔指向下一页。 */
function paintForeword(ctx: Ctx, assets: BookAssets, copy: BookCopy) {
  paperBase(ctx, { x: 0, y: 0, w: PAGE_W, h: PAGE_H }, assets, 'left')
  const left = 66
  const right = PAGE_W - 44
  const width = right - left
  text(ctx, `02 · ${copy.tabs.deduce}`, left, 40, { font: font(500, 9.5, MONO), color: RED, spacing: 3 })
  text(ctx, 'N°001', right, 40, { font: font(500, 9.5, MONO), color: INK, align: 'right', spacing: 2, alpha: 0.6 })
  doubleRule(ctx, left, right, 52)

  const titleFont = (size: number) => font(900, size, SERIF)
  let titleSize = 56
  while (titleSize > 30 && wrap(ctx, copy.foreTitle, width, titleFont(titleSize)).length > 3) titleSize -= 2
  const titleLines = wrap(ctx, copy.foreTitle, width, titleFont(titleSize))
  titleLines.forEach((line, index) => {
    text(ctx, line, left, 128 + index * (titleSize + 10), { font: titleFont(titleSize), color: INK, spacing: 2 })
  })
  const afterTitle = 128 + (titleLines.length - 1) * (titleSize + 10) + 28
  ctx.fillStyle = RED
  ctx.fillRect(left, afterTitle, 54, 3)
  const bodyFont = font(400, 15, SERIF)
  wrap(ctx, copy.foreBody, width, bodyFont).forEach((line, index) => {
    text(ctx, line, left, afterTitle + 40 + index * 27, { font: bodyFont, color: INK, alpha: 0.85 })
  })

  // 证物牌：三条线索
  const tag = { x: left + 12, y: 384, w: 188, h: 262 }
  ctx.save()
  ctx.translate(tag.x + tag.w / 2, tag.y + tag.h / 2)
  ctx.rotate(-0.045)
  ctx.translate(-tag.w / 2, -tag.h / 2)
  ctx.shadowColor = 'rgba(30,16,4,.4)'
  ctx.shadowBlur = 10
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 5
  ctx.fillStyle = '#c7985a'
  ctx.beginPath()
  ctx.moveTo(tag.w * 0.2, 0)
  ctx.lineTo(tag.w * 0.8, 0)
  ctx.lineTo(tag.w, tag.h * 0.11)
  ctx.lineTo(tag.w, tag.h)
  ctx.lineTo(0, tag.h)
  ctx.lineTo(0, tag.h * 0.11)
  ctx.closePath()
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.save()
  ctx.clip()
  ctx.globalCompositeOperation = 'multiply'
  tile(ctx, assets.board, { x: 0, y: 0, w: tag.w, h: tag.h }, 220)
  ctx.restore()
  // 穿线孔与红线
  ctx.fillStyle = '#1b130c'
  ctx.beginPath()
  ctx.arc(tag.w / 2, 24, 9, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(234,215,174,.9)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.strokeStyle = '#6e2014'
  ctx.lineWidth = 2.4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(tag.w / 2, 24)
  ctx.bezierCurveTo(tag.w / 2 + 30, -6, tag.w / 2 + 60, -30, tag.w / 2 + 120, -42)
  ctx.stroke()
  text(ctx, `N°03 · ${copy.clueLabel}`, 18, 74, { font: font(700, 12, MONO), color: INK, spacing: 1.5, alpha: 0.85 })
  ctx.fillStyle = 'rgba(23,18,13,.4)'
  ctx.fillRect(18, 86, tag.w - 36, 1)
  copy.clues.forEach((clue, index) => {
    const size = fitSize(ctx, clue, tag.w - 36, (value) => font(400, value, HAND), 30, 14)
    text(ctx, clue, 18, 128 + index * 52, { font: font(400, size, HAND), color: '#2f2f33', alpha: 0.88 })
  })
  ctx.restore()

  // 红笔：指向下一页（按可用宽度缩放，英文更长，不能写出纸页边缘）
  ctx.save()
  const maxNote = Math.min(width, 270)
  const noteSize = fitSize(ctx, copy.foreNext, maxNote, (value) => font(400, value, HAND), 26, 13)
  const noteWidth = Math.min(maxNote, measure(ctx, copy.foreNext, font(400, noteSize, HAND)))
  const noteX = right - Math.max(noteWidth, 150)
  const noteY = 690
  text(ctx, copy.foreNext, noteX, noteY, { font: font(400, noteSize, HAND), color: PEN })
  ctx.strokeStyle = PEN
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const arrowY = noteY + 16
  const arrowW = Math.max(noteWidth, 150)
  ctx.beginPath()
  ctx.moveTo(noteX, arrowY)
  ctx.bezierCurveTo(noteX + arrowW * 0.33, arrowY + 8, noteX + arrowW * 0.66, arrowY - 4, noteX + arrowW, arrowY + 2)
  ctx.moveTo(noteX + arrowW - 12, arrowY - 7)
  ctx.lineTo(noteX + arrowW, arrowY + 2)
  ctx.lineTo(noteX + arrowW - 12, arrowY + 9)
  ctx.stroke()
  ctx.restore()
}

/** 盘问说明页：左页，装订边在右。 */
function paintAskLeft(ctx: Ctx, assets: BookAssets, copy: BookCopy): Region[] {
  const regions: Region[] = []
  paperBase(ctx, { x: 0, y: 0, w: PAGE_W, h: PAGE_H }, assets, 'right')
  const left = 40
  const right = PAGE_W - 58
  const width = right - left
  text(ctx, `03 · ${copy.tabs.ask}`, left, 40, { font: font(500, 9.5, MONO), color: RED, spacing: 3 })
  text(ctx, 'N°001', right, 40, { font: font(500, 9.5, MONO), color: INK, align: 'right', spacing: 2, alpha: 0.6 })
  doubleRule(ctx, left, right, 52)

  const titleFont = (size: number) => font(900, size, SERIF)
  let titleSize = 64
  while (titleSize > 30 && wrap(ctx, copy.askTitle, width, titleFont(titleSize)).length > 3) titleSize -= 2
  const titleLines = wrap(ctx, copy.askTitle, width, titleFont(titleSize))
  titleLines.forEach((line, index) => {
    text(ctx, line, left, 136 + index * (titleSize + 12), { font: titleFont(titleSize), color: INK, spacing: 3 })
  })
  const afterTitle = 136 + (titleLines.length - 1) * (titleSize + 12) + 30
  ctx.fillStyle = RED
  ctx.fillRect(left, afterTitle, 54, 3)
  const bodyFont = font(400, 15.5, SERIF)
  wrap(ctx, copy.askBody, width, bodyFont).forEach((line, index) => {
    text(ctx, line, left, afterTitle + 44 + index * 29, { font: bodyFont, color: INK, alpha: 0.86 })
  })

  text(ctx, copy.askMeta.toUpperCase(), left, 520, { font: font(500, 10.5, MONO), color: RED, spacing: 3 })
  ctx.fillStyle = 'rgba(23,18,13,.25)'
  ctx.fillRect(left, 534, width, 1)

  const label = `${copy.play}  ↗`
  const buttonFont = font(700, 14, SERIF)
  const buttonWidth = measure(ctx, label, buttonFont, 2) + 44
  ctx.fillStyle = INK
  ctx.fillRect(left, 586, buttonWidth, 40)
  text(ctx, label, left + 22, 612, { font: buttonFont, color: '#f7efdc', spacing: 2 })
  regions.push({ x: left, y: 586, w: buttonWidth, h: 40, kind: 'play', id: 'all' })
  text(ctx, 'CASE FILE 001—2026', left + width / 2, 704, {
    font: font(500, 9.5, MONO),
    color: INK,
    align: 'center',
    spacing: 3,
    alpha: 0.45,
  })
  return regions
}

/** 讯问笔录：右页，装订边在左。横线本子；问题与输入框由网页叠层写在上面。 */
function paintAskRight(ctx: Ctx, assets: BookAssets, copy: BookCopy) {
  paperBase(ctx, { x: 0, y: 0, w: PAGE_W, h: PAGE_H }, assets, 'left')
  const left = 66
  const right = PAGE_W - 44
  ctx.fillStyle = 'rgba(70,110,170,.26)'
  for (let y = 86; y < 596; y += 30) ctx.fillRect(left - 20, y, right - left + 34, 1)
  ctx.fillStyle = 'rgba(184,50,31,.5)'
  ctx.fillRect(left - 16, 64, 1.2, 530)
  ctx.fillRect(left - 11, 64, 1, 530)
  text(ctx, copy.askRecord, left, 42, { font: font(700, 22, SERIF), color: INK, spacing: 6 })
  text(ctx, 'CASE FILE 001', right, 40, { font: font(500, 9.5, MONO), color: INK, align: 'right', spacing: 2.5 })
  doubleRule(ctx, left - 20, right + 14, 52)
  doubleRule(ctx, left - 20, right + 14, 604)
}

/**
 * 《奇案特刊》头版：同一张报纸横跨左右两页，报头压过书脊。
 * 在 1024 宽的整幅坐标里绘制，再按左右页裁出各自那一半；右页上的链接返回页内坐标。
 */
function drawFrontPage(ctx: Ctx, copy: BookCopy, regions: Region[]) {
  const L = 46
  const R = 1024 - 46
  const MID = 512
  const [leftTop, leftBottom = ''] = copy.paperLeft.split(' / ')
  const [rightTop, rightBottom = ''] = copy.paperRight.split(' / ')
  const box = (x: number, align: CanvasTextAlign, top: string, bottom: string) => {
    const boxWidth = 214
    const x0 = align === 'left' ? x : x - boxWidth
    ctx.fillStyle = INK
    ctx.fillRect(x0, 20, boxWidth, 1.2)
    ctx.fillRect(x0, 60, boxWidth, 1.2)
    text(ctx, top, x, 38, { font: font(700, 12.5, SERIF), color: INK, align, spacing: 3 })
    text(ctx, bottom.toUpperCase(), x, 53, { font: font(500, 8.5, MONO), color: RED, align, spacing: 1.6 })
  }
  box(L, 'left', leftTop, leftBottom)
  box(R, 'right', rightTop, rightBottom)

  const mastFont = (size: number) => (copy.zh ? font(900, size, SERIF) : font(700, size, HEAD))
  const mastSpacing = copy.zh ? 22 : -1
  const mastSize = fitSize(ctx, copy.mast, 540, mastFont, copy.zh ? 112 : 78, 36, mastSpacing)
  text(ctx, copy.mast, MID, 150, { font: mastFont(mastSize), color: INK, align: 'center', spacing: mastSpacing })
  text(ctx, copy.motto.replace(/\s+/g, ' ').toUpperCase(), MID, 176, {
    font: font(500, 9.5, MONO),
    color: INK,
    align: 'center',
    spacing: 6,
    alpha: 0.7,
  })
  doubleRule(ctx, L, R, 190)
  text(ctx, copy.date, L, 218, { font: font(500, 10, MONO), color: INK, spacing: 2 })
  text(ctx, `${copy.title} · ${copy.english}`, MID, 218, {
    font: font(500, 10, MONO),
    color: INK,
    align: 'center',
    spacing: 2,
  })
  text(ctx, 'N° 001', R, 218, { font: font(500, 10, MONO), color: INK, align: 'right', spacing: 2 })
  ctx.fillStyle = INK
  ctx.fillRect(L, 228, R - L, 1)

  // 左半：标题新闻
  const colW = 408
  const kickerFont = font(500, 10, MONO)
  const kickerW = measure(ctx, copy.kicker, kickerFont, 2) + 18
  ctx.fillStyle = RED
  ctx.fillRect(L, 250, kickerW, 22)
  text(ctx, copy.kicker, L + 9, 265, { font: kickerFont, color: '#f7efdc', spacing: 2 })
  const headFont = (size: number) => font(900, size, SERIF)
  // 标题先在逗号处断行，再按宽度折行
  const headBreak = (size: number) =>
    copy.headline.split(/(?<=[，,])\s*/).flatMap((part) => wrap(ctx, part, colW, headFont(size)))
  let headSize = 60
  while (headSize > 30 && headBreak(headSize).length > 3) headSize -= 2
  const headLines = headBreak(headSize)
  headLines.forEach((line, index) => {
    text(ctx, line, L, 332 + index * (headSize + 10), { font: headFont(headSize), color: INK, spacing: 1 })
  })
  let y = 332 + (headLines.length - 1) * (headSize + 10) + 36
  const leadFont = font(400, 15, SERIF)
  wrap(ctx, copy.signalBody, colW, leadFont).forEach((line) => {
    text(ctx, line, L, y, { font: leadFont, color: INK, alpha: 0.88 })
    y += 27
  })
  y += 14
  ctx.fillStyle = 'rgba(23,18,13,.4)'
  ctx.fillRect(L, y, colW, 1)
  y += 28
  // 两栏正文
  const bodyFont = font(400, 12.5, SERIF)
  const colWidth = (colW - 22) / 2
  const lines = [copy.description, copy.askBody, copy.foreBody].flatMap((paragraph) => [
    ...wrap(ctx, paragraph, colWidth, bodyFont),
    '',
  ])
  const bottom = 690
  const perColumn = Math.max(1, Math.floor((bottom - y) / 21))
  for (let column = 0; column < 2; column++) {
    lines.slice(column * perColumn, (column + 1) * perColumn).forEach((line, row) => {
      text(ctx, line, L + column * (colWidth + 22), y + row * 21, { font: bodyFont, color: INK, alpha: 0.82 })
    })
  }
  ctx.fillStyle = 'rgba(23,18,13,.25)'
  ctx.fillRect(L + colWidth + 11, y - 14, 1, bottom - y + 14)

  // 右半：引文与六节目录
  const X = 560
  const XR = R
  const W2 = XR - X
  doubleRule(ctx, X, XR, 250)
  const quoteFont = (size: number) => font(900, size, SERIF)
  let quoteSize = 38
  while (quoteSize > 22 && wrap(ctx, copy.quoteTitle, W2, quoteFont(quoteSize)).length > 2) quoteSize -= 2
  const quoteLines = wrap(ctx, copy.quoteTitle, W2, quoteFont(quoteSize))
  quoteLines.forEach((line, index) => {
    text(ctx, line, X, 298 + index * (quoteSize + 6), { font: quoteFont(quoteSize), color: RED })
  })
  let qy = 298 + (quoteLines.length - 1) * (quoteSize + 6) + 30
  const quoteBodyFont = font(400, 13.5, SERIF)
  wrap(ctx, copy.quoteBody, W2, quoteBodyFont).forEach((line) => {
    text(ctx, line, X, qy, { font: quoteBodyFont, color: INK, alpha: 0.82 })
    qy += 24
  })
  doubleRule(ctx, X, XR, qy + 2)

  // 六节目录：从引文下方排起，行距按剩余高度收紧，保证页脚的信号与链接留得下
  const listTop = Math.max(qy + 42, 424)
  text(ctx, copy.partsLabel, X, listTop, { font: font(700, 15, SERIF), color: INK, spacing: 2 })
  ctx.fillStyle = INK
  ctx.fillRect(X, listTop + 10, W2, 2)
  const rowStep = Math.min(32, (648 - (listTop + 38)) / 5)
  copy.parts.forEach((part, index) => {
    const rowY = listTop + 38 + index * rowStep
    text(ctx, `0${index + 1}`, X, rowY, { font: font(500, 10.5, MONO), color: RED })
    text(ctx, part, X + 34, rowY, { font: font(500, 16, SERIF), color: INK, alpha: 0.9 })
    ctx.fillStyle = 'rgba(23,18,13,.2)'
    ctx.fillRect(X, rowY + 8, W2, 1)
  })
  const footY = listTop + 38 + 5 * rowStep + 32
  text(ctx, copy.signalLabel.toUpperCase(), X, footY, {
    font: font(500, 9, MONO),
    color: INK,
    spacing: 1.6,
    alpha: 0.65,
  })
  const linkFont = font(700, 12, SERIF)
  const linkLabel = `${copy.signalAction} ↗`
  const linkW = measure(ctx, linkLabel, linkFont, 1.5)
  text(ctx, linkLabel, X, footY + 22, { font: linkFont, color: INK, spacing: 1.5 })
  ctx.fillStyle = INK
  ctx.fillRect(X, footY + 27, linkW, 1.4)
  // 右页内坐标（整幅坐标减去一页宽）
  regions.push({ x: X - MID - 6, y: footY + 4, w: linkW + 12, h: 30, kind: 'link', id: 'all' })
}

function paintPaperSide(ctx: Ctx, assets: BookAssets, copy: BookCopy, side: 'left' | 'right'): Region[] {
  paperBase(ctx, { x: 0, y: 0, w: PAGE_W, h: PAGE_H }, assets, side === 'left' ? 'right' : 'left')
  const regions: Region[] = []
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, PAGE_W, PAGE_H)
  ctx.clip()
  ctx.translate(side === 'left' ? 0 : -PAGE_W, 0)
  drawFrontPage(ctx, copy, regions)
  ctx.restore()
  return side === 'right' ? regions : []
}

/** 索引标签：纸张自由边外的一条，纸色加朱红边，竖排标签文字。 */
function paintTabs(ctx: Ctx, face: FaceId, copy: BookCopy): Region[] {
  const regions: Region[] = []
  const mirrored = MIRRORED_FACES.includes(face)
  for (const tab of TABS) {
    if (!tab.faces.includes(face)) continue
    // 标签与纸页相连：正面在页右侧，背面（镜像）在画布左侧
    const x = mirrored ? 0 : PAGE_W
    const y = tab.y
    ctx.save()
    ctx.beginPath()
    if (mirrored) {
      ctx.moveTo(x + TAB_W, y)
      ctx.lineTo(x + 8, y)
      ctx.lineTo(x, y + 8)
      ctx.lineTo(x, y + TAB_H - 8)
      ctx.lineTo(x + 8, y + TAB_H)
      ctx.lineTo(x + TAB_W, y + TAB_H)
    } else {
      ctx.moveTo(x, y)
      ctx.lineTo(x + TAB_W - 8, y)
      ctx.lineTo(x + TAB_W, y + 8)
      ctx.lineTo(x + TAB_W, y + TAB_H - 8)
      ctx.lineTo(x + TAB_W - 8, y + TAB_H)
      ctx.lineTo(x, y + TAB_H)
    }
    ctx.closePath()
    ctx.fillStyle = '#dcc690'
    ctx.fill()
    ctx.clip()
    ctx.fillStyle = 'rgba(120,80,30,.16)'
    ctx.fillRect(x, y + TAB_H - 14, TAB_W, 14)
    // 朱红的外缘
    ctx.fillStyle = RED
    ctx.fillRect(mirrored ? x : x + TAB_W - 5, y, 5, TAB_H)
    ctx.restore()
    ctx.strokeStyle = 'rgba(60,36,12,.35)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(mirrored ? x + TAB_W : x, y + 0.5)
    ctx.lineTo(mirrored ? x + 8 : x + TAB_W - 8, y + 0.5)
    ctx.moveTo(mirrored ? x + TAB_W : x, y + TAB_H - 0.5)
    ctx.lineTo(mirrored ? x + 8 : x + TAB_W - 8, y + TAB_H - 0.5)
    ctx.stroke()

    const label = `${tab.number} ${copy.tabs[tab.id]}`
    ctx.save()
    ctx.translate(x + TAB_W / 2 + (mirrored ? 1.5 : -1.5), y + TAB_H / 2)
    ctx.rotate(mirrored ? -Math.PI / 2 : Math.PI / 2)
    const size = fitSize(ctx, label, TAB_H - 20, (value) => font(700, value, SERIF), 14, 8, 1)
    text(ctx, label, 0, size * 0.34, {
      font: font(700, size, SERIF),
      color: INK,
      align: 'center',
      spacing: 1,
      alpha: 0.88,
    })
    ctx.restore()
    regions.push({ x, y, w: TAB_W, h: TAB_H, kind: 'tab', id: tab.id })
  }
  return regions
}

function paintPreface(ctx: Ctx, assets: BookAssets, state: PaintState): Region[] {
  const { copy, filter } = state
  const regions: Region[] = []
  paperBase(ctx, { x: 0, y: 0, w: PAGE_W, h: PAGE_H }, assets, 'left')

  const left = 66
  const right = PAGE_W - 44
  const width = right - left

  text(ctx, `${copy.register} · N°001`, left, 40, {
    font: font(500, 9.5, MONO),
    color: INK,
    spacing: 2.5,
    alpha: 0.6,
  })
  text(ctx, copy.count(CASE_ARCHIVE.length), right, 40, {
    font: font(500, 9.5, MONO),
    color: RED,
    align: 'right',
    spacing: 2,
  })
  doubleRule(ctx, left, right, 52)

  const titleSize = fitSize(ctx, copy.catalogTitle, width, (size) => font(900, size, SERIF), 72, 30, 3)
  text(ctx, copy.catalogTitle, left, 142, { font: font(900, titleSize, SERIF), color: INK, spacing: 3 })
  ctx.fillStyle = RED
  ctx.fillRect(left, 160, 54, 3)

  const noteFont = font(400, 14.5, SERIF)
  ctx.font = noteFont
  wrap(ctx, copy.catalogNote, width, noteFont).forEach((line, index) => {
    text(ctx, line, left, 200 + index * 25, { font: noteFont, color: INK, alpha: 0.82 })
  })

  text(ctx, copy.filterLabel, left, 352, { font: font(500, 9.5, MONO), color: INK, spacing: 3, alpha: 0.55 })
  const chips: { id: CaseType | 'all'; label: string; count: number }[] = [
    { id: 'all', label: copy.all, count: CASE_ARCHIVE.length },
    ...CASE_TYPES.filter((type) => CASE_ARCHIVE.some((item) => item.type === type)).map((type) => ({
      id: type,
      label: copy.types[type],
      count: CASE_ARCHIVE.filter((item) => item.type === type).length,
    })),
  ]
  let cx = left
  let cy = 366
  for (const chip of chips) {
    const labelFont = font(600, 13.5, SERIF)
    const labelWidth = measure(ctx, chip.label, labelFont)
    const countText = String(chip.count)
    const countWidth = measure(ctx, countText, font(500, 10, MONO))
    const chipWidth = 12 + labelWidth + 8 + countWidth + 12
    if (cx + chipWidth > right) {
      cx = left
      cy += 40
    }
    const active = filter === chip.id
    ctx.fillStyle = active ? INK : 'rgba(23,18,13,.04)'
    ctx.fillRect(cx, cy, chipWidth, 30)
    ctx.strokeStyle = active ? INK : 'rgba(23,18,13,.5)'
    ctx.lineWidth = 1.2
    ctx.strokeRect(cx + 0.6, cy + 0.6, chipWidth - 1.2, 28.8)
    text(ctx, chip.label, cx + 12, cy + 20, { font: labelFont, color: active ? '#f3e6c8' : INK })
    text(ctx, countText, cx + 12 + labelWidth + 8, cy + 20, {
      font: font(500, 10, MONO),
      color: active ? '#f3e6c8' : RED,
      alpha: active ? 0.75 : 1,
    })
    regions.push({
      x: cx,
      y: cy,
      w: chipWidth,
      h: 30,
      kind: 'filter',
      id: chip.id,
    })
    cx += chipWidth + 8
  }

  // 难度图例与版别
  const legendY = 548
  doubleRule(ctx, left, right, legendY - 22, 'rgba(23,18,13,.4)')
  text(ctx, copy.legend, left, legendY + 6, { font: font(500, 9.5, MONO), color: INK, spacing: 3, alpha: 0.55 })
  let lx = left
  CASE_LEVELS.forEach((level) => {
    ctx.fillStyle = INK
    const markWidth = levelMarks(ctx, level, lx, legendY + 18, INK)
    const label = copy.levels[level]
    text(ctx, label, lx, legendY + 46, { font: font(500, 12.5, SERIF), color: INK, alpha: 0.75 })
    lx += Math.max(markWidth, measure(ctx, label, font(500, 12.5, SERIF))) + 26
  })
  const editionY = 640
  const edition = (tag: string, label: string, y: number) => {
    ctx.strokeStyle = RED
    ctx.lineWidth = 1.2
    ctx.strokeRect(left + 0.6, y - 13.4, 29, 18)
    text(ctx, tag, left + 15, y - 0.5, {
      font: font(600, 9.5, MONO),
      color: RED,
      align: 'center',
      spacing: 1,
    })
    text(ctx, label, left + 42, y, { font: font(500, 13, SERIF), color: INK, alpha: 0.8 })
  }
  edition('ZH', copy.editionZh, editionY)
  edition('EN', copy.editionEn, editionY + 30)
  text(ctx, `— ${copy.preface} —`, left + width / 2, 704, {
    font: font(500, 10, MONO),
    color: INK,
    align: 'center',
    spacing: 3,
    alpha: 0.5,
  })
  return regions
}

function paintCatalog(ctx: Ctx, assets: BookAssets, state: PaintState, face: FaceId): Region[] {
  const { copy, filter, hover } = state
  const regions: Region[] = []
  const pageIndex = CATALOG_FACES.indexOf(face)
  const spine = face === 'cat2' ? 'left' : 'right'
  paperBase(ctx, { x: 0, y: 0, w: PAGE_W, h: PAGE_H }, assets, spine)

  const left = spine === 'left' ? 58 : 40
  const right = spine === 'left' ? PAGE_W - 40 : PAGE_W - 58
  const order = visibleCases(filter)
  const items = order.slice(pageIndex * PER_PAGE, (pageIndex + 1) * PER_PAGE)

  text(ctx, copy.register, left, 40, { font: font(500, 9.5, MONO), color: INK, spacing: 2.5, alpha: 0.6 })
  text(ctx, copy.page(pageIndex + 1), right, 40, {
    font: font(500, 9.5, MONO),
    color: RED,
    align: 'right',
    spacing: 2,
  })
  doubleRule(ctx, left, right, 52)

  for (let slot = 0; slot < PER_PAGE; slot++) {
    const top = ROW_TOP + slot * ROW_H
    ctx.fillStyle = 'rgba(23,18,13,.2)'
    ctx.fillRect(left, top + ROW_H - 1, right - left, 1)
    const caseIndex = items[slot]
    if (caseIndex === undefined) continue
    const item: ArchivedCase = CASE_ARCHIVE[caseIndex]
    const number = pageIndex * PER_PAGE + slot + 1
    const hovered = hover === caseIndex
    if (hovered) {
      ctx.fillStyle = 'rgba(132,34,25,.12)'
      ctx.fillRect(left - 12, top + 5, right - left + 24, ROW_H - 10)
      ctx.fillStyle = PEN
      ctx.fillRect(left - 12, top + 5, 3, ROW_H - 10)
    }
    text(ctx, String(number).padStart(2, '0'), left, top + 44, {
      font: font(600, 12, MONO),
      color: RED,
    })
    const nameX = left + 46 + (hovered ? 8 : 0)
    const nameWidth = right - nameX
    const zh = item.edition === 'zh'
    const family = zh ? SERIF : HEAD
    const nameSize = fitSize(ctx, item.name, nameWidth, (size) => font(700, size, family), zh ? 29 : 28, 16, zh ? 1 : 0)
    text(ctx, item.name, nameX, top + 48, {
      font: font(700, nameSize, family),
      color: INK,
      spacing: zh ? 1 : 0,
    })
    if (hovered) {
      // 红笔圈住案名：一圈没封口的手绘椭圆
      const nameWidth = measure(ctx, item.name, font(700, nameSize, family), zh ? 1 : 0)
      ctx.save()
      ctx.strokeStyle = PEN
      ctx.lineWidth = 2.2
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.ellipse(nameX + nameWidth / 2, top + 36, nameWidth / 2 + 16, 25, -0.025, Math.PI * 0.12, Math.PI * 2.16)
      ctx.stroke()
      ctx.restore()
    }

    const subY = top + 86
    const typeLabel = copy.types[item.type]
    const typeFont = font(700, 12, SERIF)
    const typeWidth = measure(ctx, typeLabel, typeFont, 1)
    ctx.save()
    ctx.translate(nameX + (typeWidth + 18) / 2, subY - 5)
    ctx.rotate(-0.035)
    ctx.strokeStyle = RED
    ctx.lineWidth = 1.5
    ctx.strokeRect(-(typeWidth + 18) / 2, -12, typeWidth + 18, 24)
    ctx.restore()
    text(ctx, typeLabel, nameX + 9, subY, { font: typeFont, color: RED, spacing: 1 })
    const marksX = nameX + typeWidth + 32
    const markWidth = levelMarks(ctx, item.level, marksX, subY - 8, INK)
    text(ctx, copy.levels[item.level], marksX + markWidth + 10, subY, {
      font: font(500, 12, SERIF),
      color: INK,
      alpha: 0.7,
    })
    text(ctx, (item.edition === 'zh' ? copy.editionZh : copy.editionEn).split(' · ')[0], right, subY, {
      font: font(500, 9, MONO),
      color: INK,
      align: 'right',
      spacing: 1,
      alpha: 0.55,
    })
    regions.push({ x: left - 12, y: top + 5, w: right - left + 24, h: ROW_H - 10, kind: 'case', id: caseIndex })
  }

  if (face === 'cat3') {
    const label = `${copy.browse} ↗`
    const linkFont = font(700, 15, SERIF)
    const width = measure(ctx, label, linkFont, 1)
    const y = ROW_TOP + PER_PAGE * ROW_H + 40
    text(ctx, label, left, y, { font: linkFont, color: INK, spacing: 1 })
    ctx.fillStyle = INK
    ctx.fillRect(left, y + 7, width, 1.6)
    regions.push({ x: left - 8, y: y - 22, w: width + 16, h: 40, kind: 'browse', id: 'all' })
  }

  text(ctx, `— ${pageIndex + 1} —`, left + (right - left) / 2, 704, {
    font: font(500, 10, MONO),
    color: INK,
    align: 'center',
    spacing: 3,
    alpha: 0.5,
  })
  return regions
}

/** 线索墙的两页：黑色相册卡纸、点阵、相册角贴，书脊处压暗。 */
function paintBoard(ctx: Ctx, assets: BookAssets, copy: BookCopy, side: 'left' | 'right') {
  const w = PAGE_W
  const h = PAGE_H
  ctx.fillStyle = '#1d1610'
  ctx.fillRect(0, 0, w, h)
  ctx.globalCompositeOperation = 'screen'
  ctx.globalAlpha = 0.07
  tile(ctx, assets.paper, { x: 0, y: 0, w, h }, 360)
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  ctx.fillStyle = 'rgba(236,220,188,.1)'
  for (let y = 22; y < h; y += 22) {
    for (let x = 22; x < w; x += 22) ctx.fillRect(x, y, 1.6, 1.6)
  }
  const spineX = side === 'right' ? 0 : w
  ctx.strokeStyle = 'rgba(236,220,188,.16)'
  ctx.lineWidth = 1
  ctx.strokeRect(18.5, 18.5, w - 37, h - 37)

  // 相册角贴（装订边一侧不放）
  const corner = (x: number, y: number, dx: number, dy: number) => {
    ctx.fillStyle = '#c4a468'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + dx * 26, y)
    ctx.lineTo(x, y + dy * 26)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,.4)'
    ctx.lineWidth = 0.8
    ctx.stroke()
  }
  const outerX = side === 'right' ? w - 18 : 18
  const dirX = side === 'right' ? -1 : 1
  corner(outerX, 18, dirX, 1)
  corner(outerX, h - 18, dirX, -1)

  if (side === 'left') {
    text(ctx, '02', 42, h - 78, { font: font(600, 11, MONO), color: '#ece0c4', spacing: 3, alpha: 0.5 })
    const size = fitSize(ctx, copy.wallTitle, 300, (value) => font(900, value, SERIF), 38, 20, 3)
    text(ctx, copy.wallTitle, 42, h - 42, {
      font: font(900, size, SERIF),
      color: '#ece0c4',
      spacing: 3,
      alpha: 0.86,
    })
  }

  const gutter = ctx.createLinearGradient(spineX, 0, spineX + (side === 'right' ? 90 : -90), 0)
  gutter.addColorStop(0, 'rgba(0,0,0,.78)')
  gutter.addColorStop(0.2, 'rgba(0,0,0,.4)')
  gutter.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gutter
  ctx.fillRect(side === 'right' ? 0 : w - 90, 0, 90, h)
}

/** 画一个面；返回该面当前的点击区域（画布坐标）。 */
export function paintFace(face: FaceId, ctx: Ctx, state: PaintState, assets: BookAssets): Region[] {
  ctx.setTransform(TEX_SCALE, 0, 0, TEX_SCALE, 0, 0)
  ctx.clearRect(0, 0, FACE_SIZE[face].w, FACE_SIZE[face].h)
  const origin = faceOrigin(face)
  let regions: Region[] = []
  ctx.save()
  ctx.translate(origin, 0)
  switch (face) {
    case 'cover':
      regions = paintCover(ctx, assets, state.copy, state.untied)
      break
    case 'frontis':
      regions = paintFrontis(ctx, assets, state)
      break
    case 'preface':
      regions = paintPreface(ctx, assets, state)
      break
    case 'cat1':
    case 'cat2':
    case 'cat3':
      regions = paintCatalog(ctx, assets, state, face)
      break
    case 'foreword':
      paintForeword(ctx, assets, state.copy)
      break
    case 'wallL':
      paintBoard(ctx, assets, state.copy, 'left')
      break
    case 'askL':
      regions = paintAskLeft(ctx, assets, state.copy)
      break
    case 'askR':
      paintAskRight(ctx, assets, state.copy)
      break
    case 'paperL':
      regions = paintPaperSide(ctx, assets, state.copy, 'left')
      break
    case 'paperR':
      regions = paintPaperSide(ctx, assets, state.copy, 'right')
      break
    case 'wallR':
      paintBoard(ctx, assets, state.copy, 'right')
      break
    case 'end':
      paperBase(ctx, { x: 0, y: 0, w: PAGE_W, h: PAGE_H }, assets, 'right')
      break
    case 'back':
      kraftBase(ctx, COVER_W, COVER_H, assets)
      break
  }
  ctx.restore()
  regions = regions.map((region) => ({ ...region, x: region.x + (COVER_SIZED.includes(face) ? 0 : origin) }))
  return [...regions, ...paintTabs(ctx, face, state.copy)]
}
