import { gsap } from 'gsap'
import {
  LinearSRGBColorSpace,
  PCFShadowMap,
  PerspectiveCamera,
  Raycaster,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'

import { shotAt } from './film-shots'
import { type FilmState, getFilmState, type ReelId, updateFilm } from './film-store'
import { buildOffice } from './office-set'
import { createWoodcutPass } from './woodcut-pass'

/** 渲染像素比上限：木刻线条在 1.5 倍已足够锐利。 */
const MAX_DPR = 1.5
/** 屏幕上刻痕的间距（CSS 像素）。 */
const STROKE_PITCH = 11

export type FilmEngine = ReturnType<typeof createFilmEngine>

type Options = {
  canvas: HTMLCanvasElement
  caseCount: number
  /** WebGL 上下文丢失：页面退回降级版本。 */
  onLost: () => void
}

/**
 * 影片引擎：一块固定铺满视口的画布，按当前影片段的进度摆镜头与灯，
 * 用 CSS 变换把画布贴到图版框上；画面没有变化时不出帧。
 */
export function createFilmEngine({ canvas, caseCount, onLost }: Options) {
  const renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' })
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFShadowMap
  renderer.shadowMap.autoUpdate = false
  renderer.outputColorSpace = LinearSRGBColorSpace

  const office = buildOffice(caseCount)
  const woodcut = createWoodcutPass(renderer)
  const camera = new PerspectiveCamera(36, 1, 0.1, 60)
  const raycaster = new Raycaster()
  const ndc = new Vector2()
  const point = new Vector3()

  const frameListeners = new Set<() => void>()
  const hoverListeners = new Set<(index: number | null) => void>()
  const pointer = { x: -1, y: -1, seen: false }
  const eased = { x: 0, y: 0 }
  let torch = 0
  let torchOn = true
  let interactive = true
  let hovered: number | null = null
  let focused: number | null = null
  let dirty = true
  let shadowsDirty = true
  // 只有晃动的吊灯在动时，只重画它自己的投影
  let swingDirty = false
  let lastReel: ReelId | null = null
  let lit = ''
  let shown = false
  let disposed = false

  const resize = () => {
    const width = document.documentElement.clientWidth
    const height = window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    renderer.setPixelRatio(dpr)
    renderer.setSize(width, height, false)
    const buffer = renderer.getDrawingBufferSize(new Vector2())
    woodcut.setSize(buffer.x, buffer.y)
    woodcut.uniforms.uSpacing.value = STROKE_PITCH * dpr
    camera.aspect = width / height
    dirty = true
  }

  const setHover = (index: number | null) => {
    if (index === hovered) return
    hovered = index
    for (const listener of hoverListeners) listener(index)
  }

  const applyShot = (state: FilmState, time: number) => {
    const reel = state.reel as ReelId
    const shot = shotAt(reel, state.t)
    camera.position.set(...shot.pos)
    camera.fov = shot.fov
    camera.lookAt(...shot.look)
    // 指针带动的视角偏移
    camera.rotateY(-eased.x * 0.026 * state.open)
    camera.rotateX(eased.y * 0.018 * state.open)
    camera.updateProjectionMatrix()
    camera.updateMatrixWorld()

    const { lights } = office
    lights.desk.intensity = shot.desk
    lights.moon.intensity = shot.moon
    lights.swing.intensity = shot.swing
    lights.ambient.intensity = shot.ambient
    office.setSky(shot.sky)
    lights.pendants.forEach((light, index) => {
      light.intensity = shot.pendants[index]
    })
    // 熄灯只把强度降到 0，灯始终留在场景里：灯的数量一变，所有材质都要重编译，会卡一下。
    // 哪些灯亮着变了，就把投影贴图重画一遍
    let key = ''
    for (const light of [lights.desk, lights.moon, lights.swing, ...lights.pendants]) {
      key += light.intensity > 0.01 ? '1' : '0'
    }
    if (key !== lit) {
      lit = key
      shadowsDirty = true
    }

    if (reel === 'ask') {
      office.swingPivot.rotation.z = 0.24 * Math.sin(time * 1.35)
      office.swingPivot.rotation.x = 0.07 * Math.sin(time * 0.9 + 1)
      swingDirty = true
    }

    // 手电：从镜头旁射向指针所指的方向
    ndc.set(eased.x, eased.y)
    raycaster.setFromCamera(ndc, camera)
    lights.torch.intensity = torch
    lights.torch.position.copy(raycaster.ray.origin)
    lights.torch.target.position.copy(raycaster.ray.origin).addScaledVector(raycaster.ray.direction, 8)
  }

  const tick = (time: number, deltaMs: number) => {
    if (disposed || document.hidden) return
    if (updateFilm()) dirty = true
    const state = getFilmState()
    const visible = state.reel !== null
    if (visible !== shown) {
      shown = visible
      canvas.style.visibility = visible ? 'visible' : 'hidden'
    }
    if (!visible) return
    canvas.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) scale(${state.scale})`

    const delta = Math.min(0.05, deltaMs / 1000)
    // 指针换算到图版内的坐标
    const px = ((pointer.x - state.x) / (state.scale * state.width)) * 2 - 1
    const py = -(((pointer.y - state.y) / (state.scale * state.height)) * 2 - 1)
    const inside = pointer.seen && Math.abs(px) <= 1 && Math.abs(py) <= 1
    const tx = inside ? px : 0
    const ty = inside ? py : 0
    const k = Math.min(1, delta * 6)
    if (Math.abs(tx - eased.x) + Math.abs(ty - eased.y) > 0.0004) {
      eased.x += (tx - eased.x) * k
      eased.y += (ty - eased.y) * k
      dirty = true
    }
    const torchTarget = torchOn && inside && state.open > 0.9 ? 9 : 0
    if (Math.abs(torchTarget - torch) > 0.05) {
      torch += (torchTarget - torch) * Math.min(1, delta * 5)
      dirty = true
    }

    if (state.reel !== lastReel) {
      lastReel = state.reel
      shadowsDirty = true
      dirty = true
      if (state.reel !== 'stacks') {
        setHover(null)
        office.select(focused)
      }
    }
    const animating = state.reel === 'ask'
    if (office.stepSpines(delta)) {
      shadowsDirty = true
      dirty = true
    }
    if (!dirty && !animating) return
    dirty = false

    applyShot(state, time)

    // 卷宗架：指针落在哪条卷脊上
    if (state.reel === 'stacks') {
      let hit: number | null = null
      if (interactive && inside && state.open > 0.97) {
        ndc.set(px, py)
        raycaster.setFromCamera(ndc, camera)
        const first = raycaster.intersectObjects(office.spines, true)[0]
        if (first) {
          const object = first.object.userData.index === undefined ? first.object.parent : first.object
          hit = (object?.userData.index as number | undefined) ?? null
        }
      }
      setHover(hit)
      if (office.select(hit ?? focused)) dirty = true
    }

    if (shadowsDirty || swingDirty) {
      const { lights } = office
      for (const light of [lights.desk, lights.moon, lights.swing, ...lights.pendants]) {
        if (light.castShadow && (shadowsDirty || light === lights.swing)) light.shadow.needsUpdate = true
      }
      shadowsDirty = false
      swingDirty = false
      renderer.shadowMap.needsUpdate = true
    }
    woodcut.render(office.scene, camera)
    for (const listener of frameListeners) listener()
  }

  const onPointer = (event: PointerEvent) => {
    pointer.x = event.clientX
    pointer.y = event.clientY
    pointer.seen = event.pointerType !== 'touch'
  }
  const onLeave = () => {
    pointer.seen = false
  }
  const onLostContext = (event: Event) => {
    event.preventDefault()
    onLost()
  }

  resize()
  // 着色器在加载页还盖着的时候就编译好，免得第一次滚动时卡顿
  renderer.compile(office.scene, camera)
  window.addEventListener('resize', resize)
  window.addEventListener('pointermove', onPointer, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)
  canvas.addEventListener('webglcontextlost', onLostContext)
  gsap.ticker.add(tick)

  return {
    /** 每次出帧后回调（用来刷新贴着画中物体的标签）。 */
    onFrame(listener: () => void) {
      frameListeners.add(listener)
      return () => {
        frameListeners.delete(listener)
      }
    },
    onHover(listener: (index: number | null) => void) {
      hoverListeners.add(listener)
      return () => {
        hoverListeners.delete(listener)
      }
    },
    get hovered() {
      return hovered
    },
    /** 键盘聚焦到列表里的某一宗时，让对应卷脊亮起。 */
    focusSpine(index: number | null) {
      focused = index
      if (office.select(hovered ?? focused)) dirty = true
    },
    /** 卷宗夹打开时关闭悬停与手电。 */
    setInteractive(value: boolean) {
      interactive = value
      torchOn = value
      dirty = true
    },
    /** 某条卷脊顶端在图版框内的位置（像素）；不在画面内返回 null。 */
    spineAnchor(index: number) {
      const spine = office.spines[index]
      const state = getFilmState()
      if (!spine || state.reel !== 'stacks') return null
      point.copy(spine.position)
      point.y += spine.scale.y / 2
      point.z += spine.scale.z / 2
      point.project(camera)
      if (point.z > 1 || Math.abs(point.x) > 1.05 || Math.abs(point.y) > 1.05) return null
      return {
        x: (point.x * 0.5 + 0.5) * state.scale * state.width,
        y: (1 - (point.y * 0.5 + 0.5)) * state.scale * state.height,
      }
    },
    /** 卷脊在卷宗架影片段里对应的进度（镜头横移到它面前）。 */
    spineProgress(index: number) {
      const spine = office.spines[index]
      if (!spine) return 0.5
      // 横移段：t 0.18..0.82 对应镜头注视点 x -0.85..4.6
      const k = (spine.position.x - -0.85) / (4.6 - -0.85)
      return 0.18 + Math.min(1, Math.max(0, k)) * 0.64
    },
    invalidate() {
      dirty = true
    },
    dispose() {
      disposed = true
      gsap.ticker.remove(tick)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('webglcontextlost', onLostContext)
      woodcut.dispose()
      office.dispose()
      renderer.dispose()
    },
  }
}
