import { gsap } from 'gsap'

import { emitActEnter, lens } from './hgt-store'

/**
 * 四段剪辑转场。每段返回一条 GSAP 时间线；时间线结束时下一幕已经停稳。
 * 转场期间由导演锁住滚动，结束后再把滚动位置对到下一幕的开头。
 */

export type CutEnv = {
  stage: HTMLElement
  width: number
  height: number
  /** 把某一幕设为当前画面（React 状态）。 */
  show: (index: number) => void
  /** 「是」字：中文是一个汉字，英文是 YES。 */
  yesWord: string
}

const SERIF = '"Noto Serif SC Variable", "Noto Serif SC", serif'
const INK = '#0d0b09'
const SEAL = '#b3261e'

const act = (env: CutEnv, id: string) => env.stage.querySelector<HTMLElement>(`[data-act='${id}']`) as HTMLElement
const cam = (element: HTMLElement) => element.querySelector<HTMLElement>(':scope > [data-act-cam]') as HTMLElement
const fx = <T extends Element = HTMLElement>(env: CutEnv, name: string) =>
  env.stage.querySelector<T>(`[data-fx='${name}']`) as T
const onCut = (element: HTMLElement, on: boolean) => element.toggleAttribute('data-cut', on)

/** 在字形里找一道最宽的笔画缝隙，返回相对字形中心的位置（以字号为单位）。 */
function findGap(text: string) {
  const size = 160
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(size * Math.max(1.3, text.length * 0.8) + 40)
  canvas.height = Math.ceil(size * 1.6)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return { x: 0, y: 0 }
  ctx.font = `900 ${size}px ${SERIF}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  const step = 2
  const w = Math.floor(canvas.width / step)
  const h = Math.floor(canvas.height / step)
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  const dist = new Float32Array(w * h)
  let minX = w
  let minY = h
  let maxX = 0
  let maxY = 0
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const ink = pixels[(y * step * canvas.width + x * step) * 4 + 3] > 60
      dist[y * w + x] = ink ? 0 : 1e6
      if (ink) {
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
      }
    }
  if (maxX <= minX) return { x: 0, y: 0 }
  // 两遍倒角距离变换
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      if (x > 0) dist[i] = Math.min(dist[i], dist[i - 1] + 1)
      if (y > 0) dist[i] = Math.min(dist[i], dist[i - w] + 1)
      if (x > 0 && y > 0) dist[i] = Math.min(dist[i], dist[i - w - 1] + Math.SQRT2)
      if (x < w - 1 && y > 0) dist[i] = Math.min(dist[i], dist[i - w + 1] + Math.SQRT2)
    }
  for (let y = h - 1; y >= 0; y--)
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x
      if (x < w - 1) dist[i] = Math.min(dist[i], dist[i + 1] + 1)
      if (y < h - 1) dist[i] = Math.min(dist[i], dist[i + w] + 1)
      if (x < w - 1 && y < h - 1) dist[i] = Math.min(dist[i], dist[i + w + 1] + Math.SQRT2)
      if (x > 0 && y < h - 1) dist[i] = Math.min(dist[i], dist[i + w - 1] + Math.SQRT2)
    }
  // 只在字形外框往里收一圈的范围里找，偏向中心
  const padX = (maxX - minX) * 0.14
  const padY = (maxY - minY) * 0.14
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  let best = { x: cx, y: cy, score: -1 }
  for (let y = Math.ceil(minY + padY); y < maxY - padY; y++)
    for (let x = Math.ceil(minX + padX); x < maxX - padX; x++) {
      const centre = 1 - (Math.hypot(x - cx, y - cy) / Math.hypot(maxX - minX, maxY - minY)) * 0.6
      const score = dist[y * w + x] * centre
      if (score > best.score) best = { x, y, score }
    }
  return { x: (best.x * step - canvas.width / 2) / size, y: (best.y * step - canvas.height / 2) / size }
}

type Shard = { angle: number; radius: number; size: number; spin: number; points: number[] }

function makeShards(count: number) {
  return Array.from({ length: count }, (_, i): Shard => {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4
    return {
      angle,
      radius: 0.18 + Math.random() * 0.12,
      size: 0.05 + Math.random() * 0.09,
      spin: (Math.random() - 0.5) * 3,
      points: Array.from({ length: 5 }, (_, k) => {
        const a = (k / 5) * Math.PI * 2 + Math.random() * 0.6
        return [Math.cos(a) * (0.5 + Math.random() * 0.6), Math.sin(a) * (0.5 + Math.random() * 0.6)]
      }).flat(),
    }
  })
}

/** 转场一：底片闪白 + 变速冲镜，撞进「是」字的笔画缝隙，撕开墨迹露出片名。 */
export function cutGateToSurface(env: CutEnv) {
  const { width: W, height: H } = env
  const gate = act(env, 'gate')
  const surface = act(env, 'surface')
  const gateCam = cam(gate)
  const paper = fx(env, 'paper')
  const canvas = fx<HTMLCanvasElement>(env, 'glyph')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(W * dpr)
  canvas.height = Math.round(H * dpr)
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  const text = env.yesWord
  const gap = findGap(text)
  const base = Math.min(H * 0.8, (W * 0.9) / Math.max(1, text.length * 0.78))
  const start = { x: W / 2 + gap.x * base, y: H / 2 + gap.y * base }
  const state = { s: 1, k: 0, shard: 0 }
  const shards = makeShards(14)
  const unit = Math.min(W, H)

  const draw = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    const gx = start.x + (W / 2 - start.x) * state.k
    const gy = start.y + (H / 2 - start.y) * state.k
    if (state.shard < 1) {
      // 字号固定，用变换放大：画布字号过大时浏览器会封顶，位置就对不上了
      ctx.save()
      ctx.translate(gx, gy)
      ctx.scale(state.s, state.s)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `900 ${base}px ${SERIF}`
      ctx.globalAlpha = 1 - state.shard
      ctx.fillStyle = SEAL
      ctx.fillText(text, -gap.x * base + base * 0.018, -gap.y * base + base * 0.012)
      ctx.fillStyle = INK
      ctx.fillText(text, -gap.x * base, -gap.y * base)
      ctx.restore()
    }
    if (state.shard > 0) {
      ctx.fillStyle = INK
      for (const shard of shards) {
        const r = (shard.radius + state.shard * 1.1) * unit
        const cx = W / 2 + Math.cos(shard.angle) * r
        const cy = H / 2 + Math.sin(shard.angle) * r
        const s = shard.size * unit * (1 + state.shard * 1.5)
        ctx.globalAlpha = Math.max(0, 1 - state.shard * 1.1)
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(shard.angle + shard.spin * state.shard)
        ctx.beginPath()
        for (let k = 0; k < shard.points.length; k += 2) {
          const px = shard.points[k] * s
          const py = shard.points[k + 1] * s * 0.45
          if (k === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }
    }
    ctx.globalAlpha = 1
  }

  return gsap
    .timeline()
    .set(gateCam, { filter: 'invert(1)' }, 0)
    .set(gateCam, { filter: 'none', opacity: 0 }, 0.083)
    .set([paper, canvas], { display: 'block' }, 0.083)
    .call(draw, undefined, 0.083)
    .to(state, { s: 1.06, duration: 0.3, ease: 'power1.in', onUpdate: draw }, 0.083)
    .to(state, { s: 70, k: 1, duration: 0.62, ease: 'expo.in', onUpdate: draw }, 0.383)
    .call(
      () => {
        onCut(surface, true)
        emitActEnter({ index: 1, via: 'cut' })
      },
      undefined,
      0.86,
    )
    .set(paper, { display: 'none' }, 0.88)
    .to(state, { shard: 1, duration: 0.55, ease: 'power2.out', onUpdate: draw }, 0.96)
    .call(
      () => {
        env.show(1)
        onCut(surface, false)
      },
      undefined,
      1.2,
    )
    .set(canvas, { display: 'none' }, 1.52)
    .set(gateCam, { clearProps: 'filter,opacity' }, 1.52)
}

/** 转场二：折光镜被吸到正中、拉直成取景框，整张画布向右急甩，取景框卡进「是」字翻牌的外框，再急速拉远。 */
export function cutSurfaceToVerdict(env: CutEnv) {
  const { width: W, height: H } = env
  const surface = act(env, 'surface')
  const verdict = act(env, 'verdict')
  const surfaceCam = cam(surface)
  const verdictCam = cam(verdict)
  const frame = fx(env, 'frame')
  const bars = fx(env, 'bars')
  const blur = fx<SVGFEGaussianBlurElement>(env, 'whip-blur')
  const board = verdict.querySelector<HTMLElement>("[data-board='yes']") as HTMLElement

  gsap.set(verdictCam, { clearProps: 'transform' })
  const push = verdict.querySelector<HTMLElement>('[data-push]')
  if (push) push.style.transform = 'scale(1)'
  const host = env.stage.getBoundingClientRect()
  const rect = board.getBoundingClientRect()
  const b = { x: rect.left - host.left, y: rect.top - host.top, w: rect.width, h: rect.height }
  // 镜片先被吸到正中、放大到这个半径，再拉直成取景框
  const r = Math.min(H * 0.34, W * 0.26)
  const S = (2 * r) / b.h
  const T = { x: W / 2 - S * (b.x + b.w / 2), y: H / 2 - S * (b.y + b.h / 2) }
  const offset = W * 1.32
  const pan = { t: 0 }
  const pull = { x: lens.x || W / 2, y: lens.y || H / 2, r: lens.r || r * 0.5 }
  const hold = () => {
    lens.override = { x: pull.x, y: pull.y, r: pull.r }
  }
  /** 吸附所占的时长，之后的镜头都顺延这么久。 */
  const A = 0.38

  const placeFrame = () => {
    const now = board.getBoundingClientRect()
    gsap.set(frame, { left: now.left - host.left, top: now.top - host.top, width: now.width, height: now.height })
  }
  const whip = () => {
    const t = pan.t
    gsap.set(surfaceCam, { x: -t * offset })
    gsap.set(verdictCam, { x: T.x + (1 - t) * offset, y: T.y, scale: S, transformOrigin: '0 0' })
    gsap.set(bars, { x: W - t * offset })
    blur.setAttribute('stdDeviation', `${Math.sin(t * Math.PI) * 70} 0`)
  }

  return gsap
    .timeline()
    .call(hold)
    .to(pull, { x: W / 2, y: H / 2, r, duration: A, ease: 'power3.inOut', onUpdate: hold }, 0)
    .call(
      () => {
        lens.hidden = true
      },
      undefined,
      A,
    )
    .set(
      frame,
      {
        display: 'block',
        left: W / 2 - r,
        top: H / 2 - r,
        width: 2 * r,
        height: 2 * r,
        borderRadius: '50%',
        opacity: 1,
      },
      A,
    )
    .to(
      frame,
      {
        left: W / 2 - (b.w * S) / 2,
        top: H / 2 - (b.h * S) / 2,
        width: b.w * S,
        height: b.h * S,
        borderRadius: 0,
        duration: 0.14,
        ease: 'power4.out',
      },
      A,
    )
    .call(
      () => {
        onCut(verdict, true)
        gsap.set([surfaceCam, verdictCam], { filter: 'url(#hgt-whip)' })
        gsap.set(bars, { display: 'flex' })
        whip()
      },
      undefined,
      A + 0.24,
    )
    .to(pan, { t: 1, duration: 0.56, ease: 'expo.inOut', onUpdate: whip }, A + 0.24)
    .call(
      () => {
        gsap.set([surfaceCam, verdictCam], { clearProps: 'filter' })
        gsap.set(bars, { display: 'none' })
        onCut(surface, false)
        env.show(2)
        emitActEnter({ index: 2, via: 'cut' })
      },
      undefined,
      A + 0.8,
    )
    .to(verdictCam, { x: 0, y: 0, scale: 1, duration: 0.95, ease: 'expo.out', onUpdate: placeFrame }, A + 0.84)
    .to(frame, { opacity: 0, duration: 0.5, ease: 'power2.in' }, A + 1.2)
    .call(
      () => {
        gsap.set(frame, { display: 'none' })
        gsap.set(surfaceCam, { clearProps: 'transform' })
        gsap.set(verdictCam, { clearProps: 'transform' })
        onCut(verdict, false)
        lens.hidden = false
        lens.override = null
      },
      undefined,
      A + 1.8,
    )
}

/** 转场三：快门三连跳切放大到那条朱红直线，直线化作刀锋把画面纵向劈开，左半上滑、右半下滑。 */
export function cutVerdictToPools(env: CutEnv) {
  const verdict = act(env, 'verdict')
  const pools = act(env, 'pools')
  const verdictCam = cam(verdict)
  const shutter = fx(env, 'black')
  const blade = fx(env, 'blade')
  const left = pools.querySelector<HTMLElement>("[data-col='left']") as HTMLElement
  const right = pools.querySelector<HTMLElement>("[data-col='right']") as HTMLElement
  const timeline = gsap.timeline()
  const steps = [1.03, 2.5, 6]
  steps.forEach((scale, i) => {
    const at = i * 0.22
    timeline
      .set(shutter, { opacity: 1 }, at)
      .set(verdictCam, { scale, transformOrigin: '50% 50%', filter: 'brightness(1.65) contrast(1.15)' }, at + 0.042)
      .set(shutter, { opacity: 0 }, at + 0.042)
      .set(verdictCam, { filter: 'none' }, at + 0.12)
  })
  return timeline
    .set(blade, { display: 'block', opacity: 1, scaleY: 0 }, 0.58)
    .to(blade, { scaleY: 1, duration: 0.08, ease: 'power4.out' }, 0.58)
    .call(
      () => {
        gsap.set(left, { yPercent: 0 })
        gsap.set(right, { yPercent: -50 })
        onCut(pools, true)
      },
      undefined,
      0.66,
    )
    .to(blade, { opacity: 0, duration: 0.2 }, 0.7)
    .to(left, { yPercent: -50, duration: 0.95, ease: 'power4.inOut' }, 0.7)
    .to(right, { yPercent: 0, duration: 0.95, ease: 'power4.inOut' }, 0.7)
    .call(
      () => {
        env.show(3)
        onCut(pools, false)
        emitActEnter({ index: 3, via: 'cut' })
        gsap.set(verdictCam, { clearProps: 'transform,filter' })
        gsap.set(blade, { display: 'none' })
      },
      undefined,
      1.7,
    )
}

/** 转场四：画面掉进 8 帧的抽帧慢镜，卡片带着残影坍缩到中心，像显像管关机一样压成一道白线，硬切纯黑。 */
export function cutPoolsToSeat(env: CutEnv) {
  const { width: W, height: H } = env
  const pools = act(env, 'pools')
  const seat = act(env, 'seat')
  const poolsCam = cam(pools)
  const ghosts = fx(env, 'ghosts')
  const black = fx(env, 'black')
  const host = env.stage.getBoundingClientRect()

  const cards = [...pools.querySelectorAll<HTMLElement>('[data-pool-card]')]
    .filter((card) => {
      if (card.dataset.live === '0' || card.offsetWidth === 0) return false
      const rect = card.getBoundingClientRect()
      return rect.right > host.left && rect.left < host.right && rect.bottom > host.top && rect.top < host.bottom
    })
    .slice(0, 16)

  ghosts.replaceChildren()
  const layers: HTMLElement[][] = [[], [], []]
  for (const card of cards) {
    const rect = card.getBoundingClientRect()
    const cx = rect.left + rect.width / 2 - host.left
    const cy = rect.top + rect.height / 2 - host.top
    const library = card.dataset.poolCard === 'library'
    for (let layer = 0; layer < 3; layer++) {
      const ghost = document.createElement('div')
      Object.assign(ghost.style, {
        position: 'absolute',
        left: `${cx - card.offsetWidth / 2}px`,
        top: `${cy - card.offsetHeight / 2}px`,
        width: `${card.offsetWidth}px`,
        height: `${card.offsetHeight}px`,
        background: library
          ? `linear-gradient(180deg, #f2efe6 0 34%, ${INK} 34% 64%, #f2efe6 64%)`
          : 'linear-gradient(180deg, #faf8f2, #ebe7dc)',
        border: library ? 'none' : `1px solid ${INK}`,
        opacity: String([1, 0.42, 0.18][layer]),
        rotate: `${Number(card.dataset.rot ?? 0)}deg`,
      })
      ghost.dataset.dx = String(W / 2 - cx)
      ghost.dataset.dy = String(H / 2 - cy)
      layers[layer].push(ghost)
    }
  }
  ghosts.append(...layers[2], ...layers[1], ...layers[0])

  const timeline = gsap.timeline()
  timeline
    .call(() => {
      pools.toggleAttribute('data-collapsing', true)
      gsap.set(ghosts, { display: 'block' })
    })
    .to(poolsCam, { scale: 0.94, duration: 0.875, ease: 'steps(7)' }, 0)
  layers.forEach((layer, depth) => {
    for (const ghost of layer)
      timeline.to(
        ghost,
        {
          x: Number(ghost.dataset.dx),
          y: Number(ghost.dataset.dy),
          scale: 0.18,
          rotate: `+=${gsap.utils.random(-40, 40)}`,
          duration: 0.875,
          ease: 'steps(7)',
        },
        depth * 0.125,
      )
  })
  return timeline
    .to([poolsCam, ghosts], { scaleY: 0.004, filter: 'brightness(4)', duration: 0.09, ease: 'power2.in' }, 1.15)
    .to([poolsCam, ghosts], { scaleX: 0, duration: 0.12, ease: 'power3.in' }, 1.26)
    .set(black, { opacity: 1, background: '#000' }, 1.38)
    .call(
      () => {
        ghosts.replaceChildren()
        gsap.set(ghosts, { display: 'none', clearProps: 'transform,filter' })
        gsap.set(poolsCam, { clearProps: 'transform,filter' })
        pools.toggleAttribute('data-collapsing', false)
      },
      undefined,
      1.4,
    )
    .call(
      () => {
        onCut(seat, true)
        env.show(4)
        emitActEnter({ index: 4, via: 'cut' })
      },
      undefined,
      1.88,
    )
    .set(black, { opacity: 0, clearProps: 'background' }, 1.9)
    .call(() => onCut(seat, false), undefined, 1.95)
}

/** 跳切：倒着滚回上一幕、或一次跳过好几幕时，不播转场，只闪一帧黑场。 */
export function hardCut(env: CutEnv, to: number, flash: boolean) {
  const black = fx(env, 'black')
  env.show(to)
  emitActEnter({ index: to, via: 'jump' })
  if (flash) gsap.timeline().set(black, { opacity: 1 }).set(black, { opacity: 0 }, 0.07)
}
