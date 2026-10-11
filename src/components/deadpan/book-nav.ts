import { getLenis } from '@/lib/smooth-scroll'

/**
 * 书页进度 q：第 i 次翻页占 q ∈ [i+0.1, i+0.7]，其余为停留；
 * 翻完最后一张后（q ≥ 6.2）整本书合上，各页自上而下错开 0.03 依次落回右侧，约在 6.85 合拢。
 */
export const LEAVES = 7
export const TURNS = LEAVES - 1
export const CLOSE_AT = TURNS + 0.2
export const Q_MAX = TURNS + 1.4
/** 每单位 q 占多少屏高的滚动距离。 */
export const SCREENS_PER_Q = 0.85
/**
 * 跨页：0 合上、1 开卷目录 + 总目序页、2 总目第 1、2 页、3 总目第 3 页 + 推理卷首、
 * 4 线索墙、5 盘问、6 见报、7 书合上，镜头拉远回到全景（收尾）。
 */
export const SPREADS = LEAVES + 1
export const BOARD_SPREAD = 4
export const ASK_SPREAD = 5
export const PAPER_SPREAD = 6
export const END_SPREAD = 7

/**
 * 取景：书在世界里大小固定，用整体缩放来推拉镜头。
 * 线索墙与盘问正对（缩放恰为 1，叠层与书页对齐）；见报时拉升到 paper。
 */
export const SHOT = { wide: 0.9, close: 1.06, flat: 1, paper: 1.1 }

export const SECTION_HEIGHT_SVH = (1 + Q_MAX * SCREENS_PER_Q) * 100

/** 纸的宽高比（A 系列）。 */
export const PAGE_ASPECT = 724 / 512

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))

/** 第 i 张纸的翻动进度 0..1。 */
export function turnFraction(q: number, index: number) {
  const x = clamp((q - index - 0.1) / 0.6)
  return x * x * (3 - 2 * x)
}

/** 第 i 张纸合上的进度 0..1：上面的纸先落，封面最后。 */
export function closeFraction(q: number, index: number) {
  const x = clamp((q - (CLOSE_AT + 0.03 * (TURNS - 1 - index))) / 0.5)
  return x * x * (3 - 2 * x)
}

/** 当前最接近的跨页（翻过一半算翻过；合上过半算收尾）。 */
export function spreadAt(q: number) {
  if (closeFraction(q, 2) >= 0.5) return END_SPREAD
  let spread = 0
  for (let i = 0; i < TURNS; i++) if (turnFraction(q, i) >= 0.5) spread++
  return spread
}

/** 停在某个跨页时的 q。 */
export const spreadQ = (spread: number) => (spread === 0 ? 0.02 : spread === END_SPREAD ? Q_MAX - 0.3 : spread - 0.1)

/** 一页（不含封面的大小差）在舞台里的尺寸，书与线索墙叠层共用。 */
export function pageSize(stageWidth: number, stageHeight: number) {
  const width = Math.min(stageWidth * 0.45, (stageHeight * 0.72) / PAGE_ASPECT)
  return { width, height: width * PAGE_ASPECT }
}

/** 某个跨页对应的滚动位置。 */
export function spreadScrollTop(section: HTMLElement, spread: number) {
  const top = section.getBoundingClientRect().top + window.scrollY
  const travel = Math.max(0, section.offsetHeight - window.innerHeight)
  return top + (spreadQ(spread) / Q_MAX) * travel
}

/** 滚动到某个跨页；immediate 用于章节跳转时转场幕已盖住画面。 */
export function scrollToSpread(section: HTMLElement, spread: number, immediate = false) {
  const target = spreadScrollTop(section, clamp(spread, 0, END_SPREAD))
  const lenis = getLenis()
  if (lenis) lenis.scrollTo(target, immediate ? { immediate: true, force: true } : { duration: 1.3 })
  else window.scrollTo({ top: target, behavior: immediate ? 'instant' : 'smooth' })
}
