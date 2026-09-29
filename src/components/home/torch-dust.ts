type Mote = { x: number; y: number; depth: number; vx: number; vy: number; phase: number }

/** 手电光束里漂浮的灰尘。粒子离光心越近越亮、越大。 */
export function createTorchDust(canvas: HTMLCanvasElement, count: number) {
  const context = canvas.getContext('2d')
  let width = 0
  let height = 0
  let motes: Mote[] = []

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
    width = canvas.clientWidth
    height = canvas.clientHeight
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    context?.setTransform(ratio, 0, 0, ratio, 0, 0)
    if (motes.length === 0) {
      motes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        depth: 0.25 + Math.random() * 0.75,
        vx: (Math.random() - 0.5) * 10,
        vy: -2 - Math.random() * 8,
        phase: Math.random() * Math.PI * 2,
      }))
    }
  }

  const draw = (lightX: number, lightY: number, radius: number, delta: number, time: number) => {
    if (!context) return
    context.clearRect(0, 0, width, height)
    const spread = Math.max(radius, 1) * 0.62
    const falloff = 2 * spread * spread

    for (const mote of motes) {
      mote.x += (mote.vx + Math.sin(time * 0.35 + mote.phase) * 6) * delta * mote.depth
      mote.y += (mote.vy + Math.cos(time * 0.27 + mote.phase) * 4) * delta * mote.depth
      if (mote.x < -4) mote.x += width + 8
      if (mote.x > width + 4) mote.x -= width + 8
      if (mote.y < -4) mote.y += height + 8
      if (mote.y > height + 4) mote.y -= height + 8

      const dx = mote.x - lightX
      const dy = mote.y - lightY
      const lit = Math.exp(-(dx * dx + dy * dy) / falloff)
      const alpha = 0.035 * mote.depth + lit * 0.9 * mote.depth
      if (alpha < 0.02) continue
      const size = (0.5 + mote.depth * 1.5) * (1 + lit * 0.7)
      context.fillStyle = `rgba(255, 228, 186, ${alpha.toFixed(3)})`
      context.beginPath()
      context.arc(mote.x, mote.y, size, 0, Math.PI * 2)
      context.fill()
    }
  }

  resize()
  return { resize, draw }
}
