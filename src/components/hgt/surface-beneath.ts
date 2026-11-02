import { splitKeys } from './hgt-kit'

/** 水面下的汤底：和纸面上的短句一一对位，圈出矛盾的字眼，用朱红因果线把它们咬合起来。 */

type Box = { x: number; y: number; w: number; h: number }

export type BeneathLayout = {
  width: number
  height: number
  dpr: number
  fragments: { box: Box; font: string; size: number; text: string; keys: Box[] }[]
  notes: string[]
  links: string[]
  manifesto: { box: Box; text: string }
  label: string
}

const SERIF = '"Noto Serif SC Variable", "Noto Serif SC", serif'
const MONO = '"JetBrains Mono Variable", ui-monospace, monospace'
const PAPER = 'rgba(242,239,230,'
const RED = '#e0412f'

/** 确定性的小抖动，让圈注像手画的。 */
function jitter(seed: number) {
  const x = Math.sin(seed * 127.1) * 43758.5453
  return x - Math.floor(x) - 0.5
}

function ring(ctx: CanvasRenderingContext2D, box: Box, seed: number) {
  const cx = box.x + box.w / 2
  const cy = box.y + box.h / 2
  const rx = box.w / 2 + Math.max(10, box.h * 0.3)
  const ry = box.h / 2 + Math.max(7, box.h * 0.22)
  ctx.strokeStyle = RED
  for (let pass = 0; pass < 2; pass++) {
    ctx.lineWidth = pass ? 1.2 : 2
    ctx.beginPath()
    const start = -0.4 + jitter(seed + pass) * 0.6
    for (let i = 0; i <= 64; i++) {
      const a = start + (i / 64) * (Math.PI * 2 + 0.35)
      const wobble = 1 + jitter(seed * 3 + i * 0.37 + pass) * 0.05
      const x = cx + Math.cos(a) * rx * wobble + pass * 2
      const y = cy + Math.sin(a) * ry * wobble - pass * 1.5
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
}

function arrow(ctx: CanvasRenderingContext2D, from: Box, to: Box, label: string, seed: number, labelSize: number) {
  const ax = from.x + from.w / 2
  const ay = from.y + from.h + Math.max(9, from.h * 0.3)
  const bx = to.x + to.w / 2
  const by = to.y - Math.max(9, to.h * 0.3)
  const mx = (ax + bx) / 2
  const my = (ay + by) / 2
  const nx = -(by - ay)
  const ny = bx - ax
  const length = Math.hypot(nx, ny) || 1
  const bend = 0.18 + jitter(seed) * 0.12
  const cx = mx + (nx / length) * Math.hypot(bx - ax, by - ay) * bend
  const cy = my + (ny / length) * Math.hypot(bx - ax, by - ay) * bend
  ctx.strokeStyle = RED
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.moveTo(ax, ay)
  ctx.quadraticCurveTo(cx, cy, bx, by)
  ctx.stroke()
  // 箭头沿曲线末端的切线
  const angle = Math.atan2(by - cy, bx - cx)
  ctx.fillStyle = RED
  ctx.beginPath()
  ctx.moveTo(bx, by)
  ctx.lineTo(bx - Math.cos(angle - 0.4) * 11, by - Math.sin(angle - 0.4) * 11)
  ctx.lineTo(bx - Math.cos(angle + 0.4) * 11, by - Math.sin(angle + 0.4) * 11)
  ctx.closePath()
  ctx.fill()
  // 标签贴在曲线中点
  const lx = 0.25 * ax + 0.5 * cx + 0.25 * bx
  const ly = 0.25 * ay + 0.5 * cy + 0.25 * by
  ctx.font = `600 ${labelSize}px ${MONO}`
  const w = ctx.measureText(label).width + 12
  ctx.fillStyle = '#0d0b09'
  ctx.fillRect(lx - w / 2, ly - labelSize * 0.9, w, labelSize * 1.8)
  ctx.strokeStyle = RED
  ctx.lineWidth = 1
  ctx.strokeRect(lx - w / 2 + 0.5, ly - labelSize * 0.9 + 0.5, w - 1, labelSize * 1.8 - 1)
  ctx.fillStyle = RED
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, lx, ly + 0.5)
  ctx.textAlign = 'left'
}

export async function loadBeneathFonts(layout: Pick<BeneathLayout, 'fragments' | 'notes' | 'manifesto'>) {
  if (!document.fonts) return
  const sample = layout.fragments.map((fragment) => fragment.text).join('') + layout.manifesto.text
  await Promise.allSettled([
    document.fonts.load(`900 64px ${SERIF}`, sample),
    document.fonts.load(`600 32px ${SERIF}`, sample),
    document.fonts.load(`500 12px ${MONO}`, layout.notes.join('')),
  ])
}

export function drawBeneath(canvas: HTMLCanvasElement, layout: BeneathLayout) {
  const { width, height, dpr } = layout
  canvas.width = Math.max(1, Math.round(width * dpr))
  canvas.height = Math.max(1, Math.round(height * dpr))
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = '#0d0b09'
  ctx.fillRect(0, 0, width, height)

  // 暗室里的审定网格，与纸面的网格对位
  const cell = Math.min(96, Math.max(48, width * 0.0625))
  ctx.strokeStyle = `${PAPER}.07)`
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = ((width - cell) / 2) % cell; x < width; x += cell) {
    ctx.moveTo(Math.round(x) + 0.5, 0)
    ctx.lineTo(Math.round(x) + 0.5, height)
  }
  for (let y = ((height - cell) / 2) % cell; y < height; y += cell) {
    ctx.moveTo(0, Math.round(y) + 0.5)
    ctx.lineTo(width, Math.round(y) + 0.5)
  }
  ctx.stroke()

  const small = Math.min(13, Math.max(10, width * 0.0085))

  // 纸面短句的倒影
  ctx.textBaseline = 'middle'
  for (const fragment of layout.fragments) {
    ctx.font = fragment.font
    ctx.fillStyle = `${PAPER}.34)`
    ctx.fillText(fragment.text, fragment.box.x, fragment.box.y + fragment.box.h / 2)
  }

  // 因果线：一句接一句
  layout.fragments.forEach((fragment, i) => {
    const next = layout.fragments[i + 1]
    if (!next || !layout.links[i]) return
    arrow(ctx, fragment.keys[0] ?? fragment.box, next.keys[0] ?? next.box, layout.links[i], i + 1, small)
  })

  // 圈出矛盾的字眼，写下批注
  layout.fragments.forEach((fragment, i) => {
    for (const [k, key] of fragment.keys.entries()) {
      // 关键字在底下是亮的：只在它的范围里把整句重描一遍
      ctx.save()
      ctx.beginPath()
      ctx.rect(key.x - 2, key.y - 6, key.w + 4, key.h + 12)
      ctx.clip()
      ctx.font = fragment.font
      ctx.fillStyle = `${PAPER}.96)`
      ctx.fillText(fragment.text, fragment.box.x, fragment.box.y + fragment.box.h / 2)
      ctx.restore()
      ring(ctx, key, i * 7 + k + 1)
    }
    const note = layout.notes[i]
    if (!note) return
    ctx.font = `500 ${small}px ${MONO}`
    const noteWidth = ctx.measureText(note).width
    const x = Math.max(16, Math.min(fragment.box.x, width - noteWidth - 64))
    const y = fragment.box.y + fragment.box.h + Math.max(26, fragment.size * 0.75)
    ctx.fillStyle = RED
    ctx.fillRect(x, y - small * 0.32, small * 0.62, small * 0.62)
    ctx.fillStyle = `${PAPER}.82)`
    ctx.fillText(note, x + small * 1.2, y)
    ctx.fillStyle = `${PAPER}.3)`
    ctx.fillText(`F.0${i + 1}`, fragment.box.x, fragment.box.y - small * 1.4)
  })

  // 核心宣言：压在纸面留白的正下方
  const { box, text } = layout.manifesto
  const parts = splitKeys(text)
  let size = box.h * 0.62
  const measure = () => {
    ctx.font = `900 ${size}px ${SERIF}`
    return parts.reduce((sum, part) => sum + ctx.measureText(part.text).width, 0)
  }
  while (measure() > box.w && size > 12) size -= 1
  let x = box.x + (box.w - measure()) / 2
  const y = box.y + box.h / 2
  for (const part of parts) {
    ctx.font = `900 ${size}px ${SERIF}`
    const w = ctx.measureText(part.text).width
    ctx.fillStyle = part.key ? RED : `${PAPER}.96)`
    ctx.fillText(part.text, x, y)
    if (part.key) ctx.fillRect(x, y + size * 0.62, w, Math.max(2, size * 0.06))
    x += w
  }

  ctx.font = `500 ${small}px ${MONO}`
  ctx.fillStyle = `${PAPER}.45)`
  ctx.fillText(layout.label, 24, Math.max(28, height * 0.05))
}
