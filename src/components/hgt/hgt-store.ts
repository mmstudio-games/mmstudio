/**
 * 海龟汤页的「剪辑台」：整页只有一块吸顶的舞台，滚动距离按幕划分。
 * 幕内的滚动驱动推演，跨过幕的交界时由导演触发一段剪辑转场。
 * 每帧的进度通过这里广播，不进 React 状态，也不进 Zustand。
 */

export const ACTS = [
  { id: 'gate', screens: 1 },
  { id: 'surface', screens: 2.6 },
  { id: 'verdict', screens: 3.4 },
  { id: 'pools', screens: 2.8 },
  { id: 'seat', screens: 1.4 },
] as const

export type ActId = (typeof ACTS)[number]['id']

export const ACT_STARTS: readonly number[] = ACTS.map((_, index) =>
  ACTS.slice(0, index).reduce((sum, act) => sum + act.screens, 0),
)

export const TOTAL_SCREENS = ACTS.reduce((sum, act) => sum + act.screens, 0)

/** 名义片长：一屏滚动折合 12 秒，只用来换算右侧标尺上的时间码。 */
export const SECONDS_PER_SCREEN = 12
export const FPS = 24

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
export const smooth = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}
export const mix = (a: number, b: number, t: number) => a + (b - a) * t

/** 滚动位置（以屏为单位）落在哪一幕。 */
export function actAt(u: number) {
  let index = 0
  for (let i = 0; i < ACTS.length; i++) if (u >= ACT_STARTS[i] - 1e-4) index = i
  return index
}

/** 某一幕的幕内进度，0 到 1。 */
export function actProgress(u: number, index: number) {
  return clamp((u - ACT_STARTS[index]) / ACTS[index].screens)
}

export type HgtFrame = {
  /** 秒 */
  time: number
  dt: number
  /** 舞台顶部以下滚过的距离，单位为屏 */
  u: number
  /** 当前在画面上的幕 */
  shown: number
  width: number
  height: number
}

const frameListeners = new Set<(frame: HgtFrame) => void>()

export function onHgtFrame(listener: (frame: HgtFrame) => void) {
  frameListeners.add(listener)
  return () => {
    frameListeners.delete(listener)
  }
}

export function emitHgtFrame(frame: HgtFrame) {
  for (const listener of frameListeners) listener(frame)
}

/** 某一幕被剪进画面：经过转场（cut）或直接跳切（jump）。 */
export type ActEnter = { index: number; via: 'cut' | 'jump' }
const enterListeners = new Set<(event: ActEnter) => void>()

export function onActEnter(listener: (event: ActEnter) => void) {
  enterListeners.add(listener)
  return () => {
    enterListeners.delete(listener)
  }
}

export function emitActEnter(event: ActEnter) {
  for (const listener of enterListeners) listener(event)
}

/** 指针：舞台内的位置（CSS 像素）与水平速度。触屏没有悬停，由各幕自行游走。 */
export const pointer = { x: -1, y: -1, fine: false, moved: false, vx: 0 }

/** 第一幕的折光镜，转场二要从它当前的位置与大小接手；转场开头由 override 接管，把它吸到正中。 */
export const lens: {
  x: number
  y: number
  r: number
  hidden: boolean
  override: { x: number; y: number; r: number } | null
} = { x: 0, y: 0, r: 0, hidden: false, override: null }

export function formatTimecode(u: number) {
  const totalFrames = Math.max(0, Math.floor(u * SECONDS_PER_SCREEN * FPS))
  const frames = totalFrames % FPS
  const seconds = Math.floor(totalFrames / FPS)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}:${pad(frames)}`
}
