type Mote = { x: number; y: number; vx: number; vy: number; born: number; life: number; size: number }

const CELL = 24

/** 画一枚软边刷头，用 destination-out 擦去灰尘。边缘带毛刷纹。 */
function createBrush(radius: number) {
  const size = Math.ceil(radius * 2)
  const brush = document.createElement('canvas')
  brush.width = brush.height = size
  const context = brush.getContext('2d')
  if (!context) return brush
  const gradient = context.createRadialGradient(radius, radius, 0, radius, radius, radius)
  gradient.addColorStop(0, 'rgba(0,0,0,.9)')
  gradient.addColorStop(0.55, 'rgba(0,0,0,.55)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)
  context.globalCompositeOperation = 'destination-out'
  for (let i = 0; i < 26; i++) {
    const y = Math.random() * size
    context.fillStyle = `rgba(0,0,0,${0.15 + Math.random() * 0.35})`
    context.fillRect(0, y, size, 0.6 + Math.random() * 1.4)
  }
  return brush
}

/**
 * 积尘层：dust 画布铺满灰尘，wipe 沿线段擦除并统计擦净比例；motes 画布画扬起的灰。
 */
export function createDustLayer(dust: HTMLCanvasElement, motes: HTMLCanvasElement) {
  const dustContext = dust.getContext('2d')
  const moteContext = motes.getContext('2d')
  let width = 0
  let height = 0
  let radius = 60
  let brush = createBrush(radius)
  let cells: Uint8Array = new Uint8Array(0)
  let columns = 0
  let cleared = 0
  let particles: Mote[] = []
  let frame = 0

  const paint = () => {
    if (!dustContext) return
    dustContext.globalCompositeOperation = 'source-over'
    const base = dustContext.createLinearGradient(0, 0, width, height)
    base.addColorStop(0, 'rgba(118, 103, 84, .97)')
    base.addColorStop(0.5, 'rgba(98, 86, 71, .97)')
    base.addColorStop(1, 'rgba(84, 73, 60, .98)')
    dustContext.fillStyle = base
    dustContext.fillRect(0, 0, width, height)
    // 积灰的深浅斑块
    for (let i = 0; i < 14; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const r = 80 + Math.random() * 260
      const blot = dustContext.createRadialGradient(x, y, 0, x, y, r)
      const light = Math.random() < 0.5
      blot.addColorStop(0, light ? 'rgba(170,152,126,.22)' : 'rgba(45,36,27,.22)')
      blot.addColorStop(1, 'rgba(0,0,0,0)')
      dustContext.fillStyle = blot
      dustContext.fillRect(x - r, y - r, r * 2, r * 2)
    }
    // 颗粒
    const specks = Math.round((width * height) / 70)
    for (let i = 0; i < specks; i++) {
      const light = Math.random() < 0.55
      dustContext.fillStyle = light
        ? `rgba(214,198,170,${(0.05 + Math.random() * 0.2).toFixed(2)})`
        : `rgba(30,24,18,${(0.05 + Math.random() * 0.25).toFixed(2)})`
      const s = Math.random() < 0.92 ? 1 : 2
      dustContext.fillRect(Math.random() * width, Math.random() * height, s, s)
    }
    // 纤维
    dustContext.lineWidth = 0.7
    for (let i = 0; i < 70; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const length = 6 + Math.random() * 22
      const turn = Math.random() * Math.PI
      dustContext.strokeStyle = `rgba(222,208,182,${(0.08 + Math.random() * 0.14).toFixed(2)})`
      dustContext.beginPath()
      dustContext.moveTo(x, y)
      dustContext.quadraticCurveTo(
        x + Math.cos(turn) * length * 0.6 + 4,
        y + Math.sin(turn) * length * 0.6 - 4,
        x + Math.cos(turn) * length,
        y + Math.sin(turn) * length,
      )
      dustContext.stroke()
    }
  }

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    width = dust.clientWidth
    height = dust.clientHeight
    for (const canvas of [dust, motes]) {
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
    }
    dustContext?.setTransform(ratio, 0, 0, ratio, 0, 0)
    moteContext?.setTransform(ratio, 0, 0, ratio, 0, 0)
    radius = Math.max(38, Math.min(width, height) * 0.085)
    brush = createBrush(radius)
    columns = Math.ceil(width / CELL)
    cells = new Uint8Array(columns * Math.ceil(height / CELL))
    cleared = 0
    paint()
  }

  const mark = (x: number, y: number) => {
    const reach = radius * 0.7
    const c0 = Math.max(0, Math.floor((x - reach) / CELL))
    const c1 = Math.min(columns - 1, Math.floor((x + reach) / CELL))
    const r0 = Math.max(0, Math.floor((y - reach) / CELL))
    const r1 = Math.min(cells.length / columns - 1, Math.floor((y + reach) / CELL))
    for (let r = r0; r <= r1; r++)
      for (let c = c0; c <= c1; c++) {
        const index = r * columns + c
        if (!cells[index] && Math.hypot((c + 0.5) * CELL - x, (r + 0.5) * CELL - y) < reach) {
          cells[index] = 1
          cleared++
        }
      }
  }

  const animate = () => {
    if (!moteContext) return
    const now = performance.now()
    moteContext.clearRect(0, 0, width, height)
    particles = particles.filter((mote) => now - mote.born < mote.life)
    for (const mote of particles) {
      const age = (now - mote.born) / mote.life
      const t = (now - mote.born) / 1000
      const x = mote.x + mote.vx * t
      const y = mote.y + mote.vy * t - 18 * t * t
      moteContext.fillStyle = `rgba(206,188,158,${((1 - age) * 0.8).toFixed(3)})`
      moteContext.fillRect(x, y, mote.size, mote.size)
    }
    frame = particles.length > 0 ? requestAnimationFrame(animate) : 0
  }

  const lift = (x: number, y: number, dx: number, dy: number, amount: number) => {
    const now = performance.now()
    for (let i = 0; i < amount; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * radius * 1.4,
        y: y + (Math.random() - 0.5) * radius * 1.4,
        vx: dx * (0.5 + Math.random()) * 0.8 + (Math.random() - 0.5) * 40,
        vy: dy * (0.5 + Math.random()) * 0.8 + (Math.random() - 0.5) * 40,
        born: now,
        life: 600 + Math.random() * 900,
        size: Math.random() < 0.8 ? 1.2 : 2.2,
      })
    }
    if (particles.length > 500) particles.splice(0, particles.length - 500)
    if (!frame) frame = requestAnimationFrame(animate)
  }

  /** 沿线段擦除；返回擦净比例（0–1）。 */
  const wipe = (x0: number, y0: number, x1: number, y1: number) => {
    if (!dustContext) return 0
    const distance = Math.hypot(x1 - x0, y1 - y0)
    const steps = Math.max(1, Math.ceil(distance / (radius * 0.3)))
    dustContext.globalCompositeOperation = 'destination-out'
    for (let i = 1; i <= steps; i++) {
      const x = x0 + ((x1 - x0) * i) / steps
      const y = y0 + ((y1 - y0) * i) / steps
      dustContext.drawImage(brush, x - radius, y - radius, radius * 2, radius * 2)
      mark(x, y)
    }
    lift(x1, y1, x1 - x0, y1 - y0, Math.min(14, Math.ceil(distance / 6)))
    return cells.length ? cleared / cells.length : 0
  }

  /** 散尽剩余灰尘时的扬尘。 */
  const burst = () => {
    for (let i = 0; i < 10; i++) lift(Math.random() * width, Math.random() * height, 0, -60, 20)
  }

  resize()
  return {
    resize,
    wipe,
    burst,
    get radius() {
      return radius
    },
    dispose: () => cancelAnimationFrame(frame),
  }
}
