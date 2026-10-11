import { getLenis } from '@/lib/smooth-scroll'

import type { FilmEngine } from './film-engine'

export type ReelId = 'dust' | 'stacks' | 'ask' | 'finale'
export type SegmentId = ReelId | 'front' | 'deduce' | 'record' | 'press'

type SegmentSpec = {
  id: SegmentId
  kind: 'reel' | 'paper'
  /** 章节号；同一章节的相邻段落在片轴上合并显示。 */
  chapter: string
  /** 章节名的文案键。 */
  label: string
  /** 影片段：吸顶期间走过多少屏。 */
  screens?: number
  opens?: boolean
  closes?: boolean
}

/** 页面的段落顺序：影片与纸面交替。 */
export const SEGMENTS: readonly SegmentSpec[] = [
  { id: 'dust', kind: 'reel', chapter: '00', label: 'dp.chapters.dust', screens: 3.2, opens: false, closes: true },
  { id: 'front', kind: 'paper', chapter: '01', label: 'dp.chapters.open' },
  { id: 'stacks', kind: 'reel', chapter: '01', label: 'dp.film.stacks', screens: 4, opens: true, closes: true },
  { id: 'deduce', kind: 'paper', chapter: '02', label: 'dp.chapters.deduce' },
  { id: 'ask', kind: 'reel', chapter: '03', label: 'dp.chapters.ask', screens: 2.4, opens: true, closes: true },
  { id: 'record', kind: 'paper', chapter: '03', label: 'dp.ask.record' },
  { id: 'press', kind: 'paper', chapter: '04', label: 'dp.chapters.publish' },
  { id: 'finale', kind: 'reel', chapter: 'FIN', label: 'dp.film.finale', screens: 2.4, opens: true, closes: false },
]

/** 图版开合各占的滚动距离（屏）。 */
const TRAVEL = 0.7
/** 图版收成插图时相对整屏的比例与位置。 */
export const FIGURE = { scale: 0.6, x: 0.2, y: 0.16 }

type Measured = { top: number; height: number; element: HTMLElement | null }

/** 单个影片段的图版状态。 */
export type ReelState = {
  /** 吸顶期间的进度 0..1。 */
  t: number
  /** 图版张开的程度：0 是报上的插图，1 是整屏。 */
  open: number
  /** 图版左上角相对吸顶舞台的位置（像素）与缩放。 */
  x: number
  y: number
  scale: number
  /** 吸顶舞台在视口里的纵向位置。 */
  stageY: number
}

const reelState = (): ReelState => ({ t: 0, open: 0, x: 0, y: 0, scale: FIGURE.scale, stageY: 0 })

/** 影片引擎的唯一实例；页面卸载或降级时为 null。 */
export const filmEngine: { current: FilmEngine | null } = { current: null }

export type FilmState = {
  /** 整页进度 0..1。 */
  progress: number
  /** 滚过影片结尾之后多出的距离（像素），页脚露出时片轴据此收起。 */
  overshoot: number
  /** 当前所在段落的序号。 */
  segment: number
  /** 画布当前属于哪个影片段；都不在屏幕上时为 null。 */
  reel: ReelId | null
  /** 该影片段吸顶期间的进度 0..1。 */
  t: number
  /** 图版张开的程度：0 是报上的插图，1 是整屏。 */
  open: number
  /** 图版左上角（视口像素）与缩放。 */
  x: number
  y: number
  scale: number
  width: number
  height: number
  reels: Record<ReelId, ReelState>
}

const measured = new Map<SegmentId, Measured>()
const listeners = new Set<(state: FilmState) => void>()
const state: FilmState = {
  progress: 0,
  overshoot: 0,
  segment: 0,
  reel: null,
  t: 0,
  open: 1,
  x: 0,
  y: 0,
  scale: 1,
  width: 1,
  height: 1,
  reels: { dust: reelState(), stacks: reelState(), ask: reelState(), finale: reelState() },
}
let start = 0
let end = 1
let lastScroll = -1
let lastWidth = 0
let lastHeight = 0

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
export const smooth = (from: number, to: number, value: number) => {
  const x = clamp01((value - from) / (to - from))
  return x * x * (3 - 2 * x)
}
/** 在 [a,b] 内淡入、[c,d] 内淡出的窗口函数，用于叠层文字的出没。 */
export const band = (value: number, a: number, b: number, c: number, d: number) =>
  Math.min(smooth(a, b, value), 1 - smooth(c, d, value))

export function registerSegment(id: SegmentId, element: HTMLElement | null) {
  measured.set(id, { top: 0, height: 0, element })
  measure()
}

export function unregisterSegment(id: SegmentId) {
  measured.delete(id)
}

/** 重新量每一段在文档里的位置（尺寸变化、字体就绪后调用）。 */
export function measure() {
  const scroll = window.scrollY
  let first = Number.POSITIVE_INFINITY
  let last = 0
  for (const entry of measured.values()) {
    if (!entry.element) continue
    const rect = entry.element.getBoundingClientRect()
    entry.top = rect.top + scroll
    entry.height = rect.height
    first = Math.min(first, entry.top)
    last = Math.max(last, entry.top + entry.height)
  }
  start = Number.isFinite(first) ? first : 0
  end = Math.max(start + 1, last - window.innerHeight)
  lastScroll = -1
}

/** 每帧调用：滚动位置或视口变了才重算并通知。返回是否有变化。 */
export function updateFilm() {
  const scroll = window.scrollY
  const width = document.documentElement.clientWidth
  const height = window.innerHeight
  if (scroll === lastScroll && width === lastWidth && height === lastHeight) return false
  if (width !== lastWidth || height !== lastHeight) {
    lastWidth = width
    lastHeight = height
    measure()
  }
  lastScroll = scroll

  state.progress = clamp01((scroll - start) / (end - start))
  state.overshoot = Math.max(0, scroll - end)
  state.width = width
  state.height = height
  state.reel = null
  let best = 0
  const middle = scroll + height / 2
  SEGMENTS.forEach((spec, index) => {
    const entry = measured.get(spec.id)
    if (!entry?.element) return
    if (middle >= entry.top && middle < entry.top + entry.height) state.segment = index
    if (spec.kind !== 'reel') return
    const pinned = Math.max(1, entry.height - height)
    const t = clamp01((scroll - entry.top) / pinned)
    // 吸顶舞台在视口里的纵向位置
    const stageY =
      scroll < entry.top ? entry.top - scroll : scroll > entry.top + pinned ? entry.top + pinned - scroll : 0
    const travel = TRAVEL / (spec.screens ?? 1)
    const open = (spec.opens ? smooth(0, travel, t) : 1) * (spec.closes ? 1 - smooth(1 - travel, 1, t) : 1)
    const scale = FIGURE.scale + (1 - FIGURE.scale) * open
    const x = FIGURE.x * width * (1 - open)
    const y = FIGURE.y * height * (1 - open) + stageY
    const own = state.reels[spec.id as ReelId]
    own.t = t
    own.open = open
    own.x = x
    own.y = y - stageY
    own.scale = scale
    own.stageY = stageY
    const visible = Math.min(height, y + scale * height) - Math.max(0, y)
    if (visible > best) {
      best = visible
      state.reel = spec.id as ReelId
      state.t = t
      state.open = open
      state.x = x
      state.y = y
      state.scale = scale
    }
  })
  for (const listener of listeners) listener(state)
  return true
}

export function getFilmState() {
  return state
}

export function subscribeFilm(listener: (state: FilmState) => void) {
  listeners.add(listener)
  listener(state)
  return () => {
    listeners.delete(listener)
  }
}

function scrollTo(target: number, immediate = false) {
  const lenis = getLenis()
  if (lenis) lenis.scrollTo(target, { immediate, duration: 1.4, force: true })
  else window.scrollTo({ top: target, behavior: immediate ? 'instant' : 'smooth' })
}

/** 跳到整页进度的某一处（片轴点击与拖动）。 */
export function seekProgress(progress: number, immediate = false) {
  scrollTo(start + clamp01(progress) * (end - start), immediate)
}

/** 跳到某个影片段内的进度 t。 */
export function seekReel(id: ReelId, t: number) {
  const entry = measured.get(id)
  if (!entry?.element) return
  scrollTo(entry.top + clamp01(t) * Math.max(1, entry.height - window.innerHeight))
}

/** 每一段在整页进度上的起止，供片轴画刻度。 */
export function segmentRanges() {
  const starts = SEGMENTS.map((spec) => {
    const entry = measured.get(spec.id)
    return entry?.element ? clamp01((entry.top - start) / (end - start)) : 0
  })
  return SEGMENTS.map((spec, index) => ({
    ...spec,
    from: starts[index],
    to: Math.max(starts[index], index + 1 < starts.length ? starts[index + 1] : 1),
  }))
}
