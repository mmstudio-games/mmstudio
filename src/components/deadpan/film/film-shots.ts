import type { ReelId } from './film-store'

type Vec = [number, number, number]

/** 一个关键机位：镜头与灯。数值之间按影片进度插值。 */
export type Shot = {
  t: number
  pos: Vec
  look: Vec
  fov: number
  /** 台灯、月光（收尾时是晨光）、三盏吊灯、晃动的吊灯、环境光。 */
  desk: number
  moon: number
  pendants: Vec
  swing: number
  ambient: number
  /** 窗外天光 0..1。 */
  sky: number
}

const NIGHT = { moon: 2.2, ambient: 0.06, sky: 0.03 }

/** 各影片段的机位表。t 是该段吸顶期间的进度。 */
export const SHOTS: Record<ReelId, Shot[]> = {
  // 案桌，台灯几乎没亮 → 灯亮起来 → 抬起后退，露出整间屋子
  dust: [
    {
      t: 0,
      pos: [-2.0, 1.52, 2.62],
      look: [-3.5, 0.9, 0.15],
      fov: 34,
      desk: 0.1,
      pendants: [0, 0, 0],
      swing: 0,
      ...NIGHT,
    },
    {
      t: 0.15,
      pos: [-2.16, 1.5, 2.4],
      look: [-3.5, 0.88, 0.15],
      fov: 34,
      desk: 15,
      pendants: [0, 0, 0],
      swing: 0,
      ...NIGHT,
    },
    {
      t: 0.4,
      pos: [-1.8, 1.62, 2.9],
      look: [-3.4, 0.95, 0],
      fov: 35,
      desk: 15,
      pendants: [10, 0, 0],
      swing: 0,
      ...NIGHT,
    },
    {
      t: 0.72,
      pos: [3.2, 1.75, 7.2],
      look: [-0.5, 1.35, -1.2],
      fov: 38,
      desk: 15,
      pendants: [34, 30, 22],
      swing: 0,
      ...NIGHT,
    },
    {
      t: 1,
      pos: [3.9, 1.85, 8.3],
      look: [-0.3, 1.4, -1.2],
      fov: 38,
      desk: 15,
      pendants: [34, 30, 22],
      swing: 0,
      ...NIGHT,
    },
  ],
  // 顺着卷宗架望过去 → 沿架横移 → 退后
  stacks: [
    {
      t: 0,
      pos: [-3.9, 1.62, -0.9],
      look: [5.6, 1.35, -3.3],
      fov: 44,
      desk: 8,
      pendants: [15, 15, 12],
      swing: 0,
      ...NIGHT,
    },
    {
      t: 0.18,
      pos: [-1.75, 1.56, -1.5],
      look: [-0.85, 1.5, -3.7],
      fov: 40,
      desk: 8,
      pendants: [15, 15, 12],
      swing: 0,
      ...NIGHT,
    },
    {
      t: 0.82,
      pos: [3.7, 1.56, -1.5],
      look: [4.6, 1.5, -3.7],
      fov: 40,
      desk: 8,
      pendants: [15, 15, 12],
      swing: 0,
      ...NIGHT,
    },
    {
      t: 1,
      pos: [5.4, 1.7, 1.1],
      look: [2.1, 1.45, -3.7],
      fov: 42,
      desk: 8,
      pendants: [15, 15, 12],
      swing: 0,
      ...NIGHT,
    },
  ],
  // 屋子另一头的空桌，只亮一盏晃动的吊灯；从侧面看过去，两把椅子隔桌相对
  ask: [
    {
      t: 0,
      pos: [-1.6, 1.7, 5.2],
      look: [3.4, 1.0, 3.4],
      fov: 34,
      desk: 0,
      moon: 0.6,
      pendants: [0, 0, 0],
      swing: 22,
      ambient: 0.014,
      sky: 0.02,
    },
    {
      t: 0.5,
      pos: [-0.4, 1.5, 4.6],
      look: [3.4, 1.0, 3.4],
      fov: 32,
      desk: 0,
      moon: 0.6,
      pendants: [0, 0, 0],
      swing: 26,
      ambient: 0.014,
      sky: 0.02,
    },
    {
      t: 1,
      pos: [0.2, 1.42, 4.2],
      look: [3.4, 1.0, 3.4],
      fov: 32,
      desk: 0,
      moon: 0.6,
      pendants: [0, 0, 0],
      swing: 26,
      ambient: 0.014,
      sky: 0.02,
    },
  ],
  // 天亮了：灯都熄了，窗外的光落进屋里，满屋都是浅浅的刻痕
  finale: [
    {
      t: 0,
      pos: [3.4, 1.6, 4.2],
      look: [-5.6, 1.5, -0.6],
      fov: 38,
      desk: 6,
      moon: 2.2,
      pendants: [0, 0, 0],
      swing: 0,
      ambient: 0.06,
      sky: 0.03,
    },
    {
      t: 0.45,
      pos: [2.2, 1.52, 3.4],
      look: [-5.8, 1.55, -0.5],
      fov: 36,
      desk: 0,
      moon: 9,
      pendants: [0, 0, 0],
      swing: 0,
      ambient: 0.3,
      sky: 0.6,
    },
    {
      t: 1,
      pos: [1.2, 1.48, 2.9],
      look: [-5.9, 1.6, -0.5],
      fov: 34,
      desk: 0,
      moon: 13,
      pendants: [0, 0, 0],
      swing: 0,
      ambient: 0.48,
      sky: 1.6,
    },
  ],
}

const ease = (x: number) => x * x * (3 - 2 * x)
const mix = (a: number, b: number, k: number) => a + (b - a) * k
const mix3 = (a: Vec, b: Vec, k: number): Vec => [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)]

/** 取某段在进度 t 处的机位（相邻关键机位之间缓入缓出）。 */
export function shotAt(reel: ReelId, t: number): Shot {
  const shots = SHOTS[reel]
  if (t <= shots[0].t) return shots[0]
  for (let i = 1; i < shots.length; i++) {
    const a = shots[i - 1]
    const b = shots[i]
    if (t > b.t) continue
    const k = ease((t - a.t) / (b.t - a.t))
    return {
      t,
      pos: mix3(a.pos, b.pos, k),
      look: mix3(a.look, b.look, k),
      fov: mix(a.fov, b.fov, k),
      desk: mix(a.desk, b.desk, k),
      moon: mix(a.moon, b.moon, k),
      pendants: mix3(a.pendants, b.pendants, k),
      swing: mix(a.swing, b.swing, k),
      ambient: mix(a.ambient, b.ambient, k),
      sky: mix(a.sky, b.sky, k),
    }
  }
  return shots[shots.length - 1]
}
