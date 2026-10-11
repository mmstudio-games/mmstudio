import { Canvas, type ThreeEvent, useFrame, useThree } from '@react-three/fiber'
import { type MutableRefObject, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  FrontSide,
  type Group,
  type Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  type PerspectiveCamera,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three'
import { DEADPAN_URL, GITHUB_URL } from '@/i18n'
import { BOARD_SPREAD, closeFraction, LEAVES, pageSize, SHOT, spreadAt, TURNS, turnFraction } from './book-nav'
import {
  type BookAssets,
  type BookCopy,
  COVER_H,
  COVER_W,
  caseFace,
  FACE_IDS,
  FACE_SIZE,
  type FaceId,
  faceCanvasSize,
  faceOrigin,
  hasTabZone,
  hitRegion,
  loadBookAssets,
  MIRRORED_FACES,
  PAGE_H,
  PAGE_W,
  type PaintState,
  paintFace,
  type Region,
  TAB_W,
  type TabId,
} from './book-pages'
import { CATALOG_URL, type CaseType } from './case-archive'

const FOV = 16
/** 每张纸与封底在厚度方向上占的像素。 */
const LEAF_T = 9
const BOARD_T = 6
/** 前倾角：书整体向观众前倾，使顶部露出纸边。 */
const TILT = 0.26
const NX = 44
const NY = 6
const CURL = 0.85
const CORNER = 0.34

type Face = { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; texture: CanvasTexture; regions: Region[] }

const LEAF_DEFS: { front: FaceId; back: FaceId; cover?: boolean }[] = [
  { front: 'cover', back: 'frontis', cover: true },
  { front: 'preface', back: 'cat1' },
  { front: 'cat2', back: 'cat3' },
  { front: 'foreword', back: 'wallL' },
  { front: 'wallR', back: 'askL' },
  { front: 'askR', back: 'paperL' },
  { front: 'paperR', back: 'end' },
]

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const smooth = (x: number) => {
  const t = clamp(x)
  return t * t * (3 - 2 * t)
}

type LeafGeometry = { geometry: BufferGeometry; position: BufferAttribute; width: number; height: number }

function makeLeafGeometry(width: number, height: number): LeafGeometry {
  const count = (NX + 1) * (NY + 1)
  const position = new BufferAttribute(new Float32Array(count * 3), 3)
  const uv = new Float32Array(count * 2)
  const index: number[] = []
  for (let r = 0; r <= NY; r++) {
    for (let j = 0; j <= NX; j++) {
      const i = r * (NX + 1) + j
      uv[i * 2] = j / NX
      uv[i * 2 + 1] = 1 - r / NY
    }
  }
  for (let r = 0; r < NY; r++) {
    for (let j = 0; j < NX; j++) {
      const a = r * (NX + 1) + j
      const b = a + 1
      const c = a + NX + 1
      const d = c + 1
      index.push(a, c, b, b, c, d)
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', position)
  geometry.setAttribute('uv', new BufferAttribute(uv, 2))
  geometry.setIndex(index)
  return { geometry, position, width, height }
}

/**
 * 让一张纸绕书脊翻到 theta（0 平放右侧，π 平放左侧）。
 * 沿纸面逐段累加方向：自由边领先（像手捏着外沿翻），下角略滞后带出卷角。
 */
function bendLeaf(leaf: LeafGeometry, theta: number, zRight: number, zLeft: number) {
  const { position, width, height } = leaf
  const array = position.array as Float32Array
  const rootZ = zRight + (zLeft - zRight) * (theta / Math.PI)
  const sine = Math.sin(theta)
  const step = width / NX
  for (let r = 0; r <= NY; r++) {
    const v = 1 - r / NY
    const y = height / 2 - (r * height) / NY
    let x = 0
    let z = rootZ
    let o = r * (NX + 1) * 3
    array[o] = x
    array[o + 1] = y
    array[o + 2] = z
    for (let j = 1; j <= NX; j++) {
      const t = (j - 0.5) / NX
      const angle = Math.min(Math.PI, theta + CURL * sine * t ** 1.35 - CORNER * sine * (1 - v) * t * t)
      x += step * Math.cos(angle)
      z += step * Math.sin(angle)
      o += 3
      array[o] = x
      array[o + 1] = y
      array[o + 2] = z
    }
  }
  position.needsUpdate = true
  leaf.geometry.computeVertexNormals()
  leaf.geometry.computeBoundingSphere()
}

function stripeTexture(axis: 'u' | 'v') {
  const canvas = document.createElement('canvas')
  canvas.width = axis === 'u' ? 16 : 4
  canvas.height = axis === 'v' ? 16 : 4
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#e3d8bd'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'rgba(86,64,34,.42)'
    for (let i = 0; i < 16; i += 2) {
      if (axis === 'v') ctx.fillRect(0, i, canvas.width, 1)
      else ctx.fillRect(i, 0, 1, canvas.height)
    }
  }
  const texture = new CanvasTexture(canvas)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.colorSpace = SRGBColorSpace
  return texture
}

function shadowTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.shadowColor = 'rgba(0,0,0,.95)'
    ctx.shadowBlur = 38
    ctx.shadowOffsetX = 1000
    ctx.fillStyle = '#000'
    ctx.fillRect(70 - 1000, 70, size - 140, size - 140)
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

export type CaseBookSceneProps = {
  /** 书页进度 q（见 book-nav）；由滚动写入。 */
  progress: MutableRefObject<number>
  /** 为 true 时下一帧直接就位，不播放翻页（章节跳转后）。 */
  snap: MutableRefObject<boolean>
  /** 让场景出一帧；由场景在挂载后填入。 */
  invalidateRef: MutableRefObject<(() => void) | null>
  copy: BookCopy
  filter: CaseType | 'all'
  /** 键盘聚焦的案卷：书翻到对应页并高亮。 */
  focusCase: number | null
  /** 封面绕线扣是否已解开。 */
  untied: boolean
  cursor: {
    open: string
    filter: string
    browse: string
    tie: string
    play: string
    link: string
    tabs: Record<TabId, string>
  }
  onFilter: (filter: CaseType | 'all') => void
  onTab: (tab: TabId) => void
  onTie: () => void
  /** 指针悬停的案卷（CASE_ARCHIVE 下标）；离开为 null。 */
  onHoverCase: (index: number | null) => void
  /** 停稳的跨页；翻页途中为 null。 */
  onRest: (spread: number | null) => void
}

type BookProps = CaseBookSceneProps

const currentHover = (state: { pointer: number | null; focus: number | null }) => state.pointer ?? state.focus

function Book({
  progress,
  snap,
  invalidateRef,
  copy,
  filter,
  focusCase,
  untied,
  cursor,
  onFilter,
  onTab,
  onTie,
  onHoverCase,
  onRest,
}: BookProps) {
  const { size, camera, gl, invalidate } = useThree()
  const { width: W, height: H } = pageSize(size.width, size.height)
  const coverW = (W * COVER_W) / PAGE_W
  const coverH = (H * COVER_H) / PAGE_H

  const faces = useMemo(() => {
    const map = {} as Record<FaceId, Face>
    for (const id of FACE_IDS) {
      const { width, height } = faceCanvasSize(id)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
      ctx.fillStyle = id.startsWith('wall') ? '#1d1610' : id === 'cover' || id === 'back' ? '#a98c60' : '#e6cfaa'
      ctx.fillRect(0, 0, width, height)
      const texture = new CanvasTexture(canvas)
      texture.colorSpace = SRGBColorSpace
      if (MIRRORED_FACES.includes(id)) {
        texture.wrapS = RepeatWrapping
        texture.repeat.x = -1
        texture.offset.x = 1
      }
      map[id] = { canvas, ctx, texture, regions: [] }
    }
    return map
  }, [])

  useEffect(() => {
    const anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
    for (const id of FACE_IDS) faces[id].texture.anisotropy = anisotropy
    return () => {
      for (const id of FACE_IDS) faces[id].texture.dispose()
    }
  }, [faces, gl])

  const extras = useMemo(() => {
    const right = { sideU: stripeTexture('u'), sideV: stripeTexture('v') }
    const left = { sideU: stripeTexture('u'), sideV: stripeTexture('v') }
    // 纸边方块只当背景：不写深度、先于纸页绘制，所以翻页时它的厚度怎么变都不会盖住纸页；正面不画
    const hidden = new MeshBasicMaterial({ visible: false })
    const edge = (map: CanvasTexture) => new MeshLambertMaterial({ map, depthWrite: false })
    const make = (set: typeof right) => [
      edge(set.sideU),
      edge(set.sideU),
      edge(set.sideV),
      edge(set.sideV),
      hidden,
      hidden,
    ]
    return { right, left, rightMaterials: make(right), leftMaterials: make(left), shadow: shadowTexture() }
  }, [])

  useEffect(
    () => () => {
      for (const set of [extras.right, extras.left]) {
        set.sideU.dispose()
        set.sideV.dispose()
      }
      for (const material of [...extras.rightMaterials, ...extras.leftMaterials]) material.dispose()
      extras.shadow.dispose()
    },
    [extras],
  )

  const leaves = useMemo(
    () =>
      LEAF_DEFS.map((def) =>
        def.cover ? makeLeafGeometry(coverW, coverH) : makeLeafGeometry((W * (PAGE_W + TAB_W)) / PAGE_W, H),
      ),
    [W, H, coverW, coverH],
  )
  useEffect(
    () => () => {
      for (const leaf of leaves) leaf.geometry.dispose()
    },
    [leaves],
  )

  const group = useRef<Group>(null)
  const rightBlock = useRef<Mesh>(null)
  const leftBlock = useRef<Mesh>(null)
  const angles = useRef(new Float32Array(LEAVES))
  const applied = useRef(new Float32Array(LEAVES).fill(-9))
  const rest = useRef<number | null | undefined>(undefined)
  const dirty = useRef(true)

  /* ---- 贴图绘制 ---- */
  const assets = useRef<BookAssets | null>(null)
  const paintState = useRef<PaintState>({ copy, filter, hover: null, untied })
  const hover = useRef<{ pointer: number | null; focus: number | null }>({ pointer: null, focus: focusCase })

  const paint = useCallback(
    (ids: FaceId[]) => {
      const loaded = assets.current
      if (!loaded) return
      for (const id of ids) {
        const face = faces[id]
        face.regions = paintFace(id, face.ctx, paintState.current, loaded)
        face.texture.needsUpdate = true
      }
      invalidate()
    },
    [faces, invalidate],
  )

  const setHover = useCallback(
    (source: 'pointer' | 'focus', value: number | null) => {
      const before = currentHover(hover.current)
      hover.current[source] = value
      const after = currentHover(hover.current)
      if (before === after) return
      paintState.current = { ...paintState.current, hover: after }
      if (source === 'pointer') onHoverCase(value)
      const touched = new Set<FaceId>()
      for (const index of [before, after]) {
        const face = index === null ? null : caseFace(index, paintState.current.filter)
        if (face) touched.add(face)
      }
      paint([...touched])
    },
    [paint, onHoverCase],
  )

  useEffect(() => {
    paintState.current = { copy, filter, hover: currentHover(hover.current), untied: paintState.current.untied }
    let cancelled = false
    loadBookAssets(copy)
      .then((loaded) => {
        if (cancelled) return
        assets.current = loaded
        paint(FACE_IDS)
      })
      .catch((error) => console.error('book assets', error))
    return () => {
      cancelled = true
    }
  }, [copy, filter, paint])

  useEffect(() => {
    setHover('focus', focusCase)
  }, [focusCase, setHover])

  // 解开绕线扣：只重画封面
  useEffect(() => {
    paintState.current = { ...paintState.current, untied }
    paint(['cover'])
  }, [untied, paint])

  useEffect(() => {
    invalidateRef.current = invalidate
    return () => {
      invalidateRef.current = null
    }
  }, [invalidate, invalidateRef])

  /* ---- 镜头：1 个世界单位 = 1 个 CSS 像素（z = 0 平面） ---- */
  useLayoutEffect(() => {
    const perspective = camera as PerspectiveCamera
    perspective.fov = FOV
    const distance = size.height / 2 / Math.tan((FOV * Math.PI) / 360)
    perspective.position.set(0, 0, distance)
    perspective.near = distance * 0.25
    perspective.far = distance * 3
    perspective.updateProjectionMatrix()
    dirty.current = true
    invalidate()
  }, [camera, size.height, invalidate])

  /* ---- 指针：用 uv 在页面贴图上做命中 ---- */
  const hovered = useRef<Region | null>(null)
  const clearPointer = useCallback(() => {
    hovered.current = null
    delete gl.domElement.dataset.cursor
    setHover('pointer', null)
  }, [gl, setHover])

  // 指针移到书外时没有任何网格被命中，r3f 不会回调；这里在下一帧补一次清除
  const lastHit = useRef(0)
  useEffect(() => {
    const element = gl.domElement
    const onNativeMove = () => {
      const stamp = performance.now()
      requestAnimationFrame(() => {
        if (hovered.current && lastHit.current < stamp) clearPointer()
      })
    }
    element.addEventListener('pointerleave', clearPointer)
    element.addEventListener('pointermove', onNativeMove)
    return () => {
      element.removeEventListener('pointerleave', clearPointer)
      element.removeEventListener('pointermove', onNativeMove)
    }
  }, [gl, clearPointer])

  /**
   * 命中判定：返回点击区域；null 表示纸面上没有可点之处；'through' 表示击中的是纸页外透明的标签区，
   * 事件应穿过去交给下面那张纸（它的索引标签可能就在这里）。
   */
  const locate = (event: ThreeEvent<PointerEvent | MouseEvent>): Region | null | 'through' => {
    if (rest.current === null || rest.current === undefined || !event.uv) return null
    const id = event.object.userData.face as FaceId
    const u = MIRRORED_FACES.includes(id) ? 1 - event.uv.x : event.uv.x
    const x = u * FACE_SIZE[id].w
    const y = (1 - event.uv.y) * FACE_SIZE[id].h
    const region = hitRegion(faces[id].regions, x, y)
    if (region) return region
    const origin = faceOrigin(id)
    if (hasTabZone(id) && (x < origin || x > origin + PAGE_W)) return 'through'
    return null
  }

  const onMove = (event: ThreeEvent<PointerEvent>) => {
    const found = locate(event)
    if (found === 'through') return
    event.stopPropagation()
    lastHit.current = performance.now()
    const region = found
    if (region === hovered.current) return
    hovered.current = region ?? null
    if (!region) {
      delete gl.domElement.dataset.cursor
      setHover('pointer', null)
      return
    }
    gl.domElement.dataset.cursor =
      region.kind === 'case'
        ? cursor.open
        : region.kind === 'browse'
          ? cursor.browse
          : region.kind === 'tab'
            ? cursor.tabs[region.id as TabId]
            : region.kind === 'tie'
              ? cursor.tie
              : region.kind === 'link'
                ? cursor.link
                : region.kind === 'play'
                  ? cursor.play
                  : cursor.filter
    setHover('pointer', region.kind === 'case' ? (region.id as number) : null)
  }

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    const region = locate(event)
    if (region === 'through') return
    event.stopPropagation()
    if (!region) return
    if (region.kind === 'filter') onFilter(region.id as CaseType | 'all')
    else if (region.kind === 'tab') onTab(region.id as TabId)
    else if (region.kind === 'tie') onTie()
    else if (region.kind === 'play') window.open(DEADPAN_URL, '_blank', 'noopener,noreferrer')
    else if (region.kind === 'link') window.open(GITHUB_URL, '_blank', 'noopener,noreferrer')
    else window.open(CATALOG_URL, '_blank', 'noopener,noreferrer')
  }

  // three.js 网格不是 DOM 元素：命中后在贴图上判断点击区域，键盘操作走 sr-only 的 DOM 列表
  const hit = { onPointerMove: onMove, onClick }

  // 鼠标位置带动视角轻微偏移（精确指针设备；正对取景时为 0，保证叠层对齐）
  const look = useRef({ x: 0, y: 0, tx: 0, ty: 0 })
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const move = (event: PointerEvent) => {
      look.current.tx = (event.clientX / window.innerWidth - 0.5) * 2
      look.current.ty = (event.clientY / window.innerHeight - 0.5) * 2
      invalidate()
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [invalidate])

  /* ---- 每帧：阻尼、弯曲、堆叠厚度 ---- */
  useFrame((_, delta) => {
    const q = progress.current
    const dt = Math.min(delta, 0.05)
    const current = angles.current
    let moving = false
    for (let i = 0; i < LEAVES; i++) {
      const target = i < TURNS ? turnFraction(q, i) * (1 - closeFraction(q, i)) * Math.PI : 0
      if (snap.current) current[i] = target
      else {
        const diff = target - current[i]
        if (Math.abs(diff) < 0.0015) current[i] = target
        else {
          current[i] += diff * (1 - Math.exp(-dt * 10))
          moving = true
        }
      }
    }
    snap.current = false

    let depthRight = 0
    let depthLeft = 0
    for (let i = 0; i < LEAVES; i++) {
      // 只统计基本落定的纸页：翻到一半的那张在空中，不算进任何一侧的厚度
      const turned = current[i] / Math.PI
      depthRight += LEAF_T * smooth((0.75 - turned) / 0.3)
      depthLeft += LEAF_T * smooth((turned - 0.25) / 0.3)
      if (dirty.current || Math.abs(current[i] - applied.current[i]) > 1e-4) {
        applied.current[i] = current[i]
        const zRight = BOARD_T + LEAF_T * (LEAVES - i) - 0.5
        const zLeft = BOARD_T + LEAF_T * i + LEAF_T - 0.5
        bendLeaf(leaves[i], current[i], zRight, zLeft)
      }
    }
    dirty.current = false

    const root = group.current
    if (root) {
      // 取景：合上时全景，翻开后推近，翻到线索墙时正对（缩放恰为 1，倾角为 0，视角偏移为 0）
      const open = smooth(current[0] / Math.PI)
      const flat = smooth((current[BOARD_SPREAD - 1] / Math.PI - 0.55) / 0.45)
      const paperShot = smooth(current[TURNS - 1] / Math.PI)
      const flatScale = SHOT.flat + (SHOT.paper - SHOT.flat) * paperShot
      const scale = (SHOT.wide + (SHOT.close - SHOT.wide) * open) * (1 - flat) + flatScale * flat
      const view = look.current
      view.x += (view.tx - view.x) * 0.08
      view.y += (view.ty - view.y) * 0.08
      if (Math.abs(view.tx - view.x) + Math.abs(view.ty - view.y) > 0.002) moving = true
      root.scale.setScalar(scale)
      root.rotation.x = TILT * (1 - flat) + view.y * 0.035 * (1 - flat)
      root.rotation.y = view.x * 0.05 * (1 - flat)
      root.position.x = (-W / 2) * (1 - open) * scale
      root.position.z = -(BOARD_T + (depthRight + depthLeft) / 2) * scale
    }
    for (const [block, depth, textures, direction] of [
      [rightBlock.current, depthRight, extras.right, 1],
      [leftBlock.current, depthLeft, extras.left, -1],
    ] as const) {
      if (!block) continue
      const body = Math.max(depth, 0.01)
      block.visible = depth > 0.2
      block.scale.set(W - 3, H - 4, body)
      block.position.set((direction * W) / 2, 0, BOARD_T + body / 2)
      textures.sideU.repeat.set(body / 16, 1)
      textures.sideV.repeat.set(1, body / 16)
    }

    const settled = moving ? null : spreadAt(q)
    if (settled !== rest.current) {
      rest.current = settled
      onRest(settled)
      if (settled === null) {
        hovered.current = null
        delete gl.domElement.dataset.cursor
        setHover('pointer', null)
      }
    }
    if (moving) invalidate()
  })

  return (
    <>
      <ambientLight intensity={Math.PI * 0.62} />
      <directionalLight position={[-300, 520, 900]} intensity={Math.PI * 0.5} />
      <group ref={group}>
        <mesh position={[0, -4, -14]}>
          <planeGeometry args={[W * 2 + 150, H + 130]} />
          <meshBasicMaterial map={extras.shadow} transparent opacity={0.7} depthWrite={false} />
        </mesh>

        {/* 封底硬壳：只在合上与翻到最后时露出边框 */}
        <mesh position={[coverW / 2, 0, BOARD_T / 2]} scale={[coverW, coverH, BOARD_T]} renderOrder={-2}>
          <boxGeometry args={[1, 1, 1]} />
          <meshLambertMaterial map={faces.back.texture} />
        </mesh>

        <mesh ref={rightBlock} material={extras.rightMaterials} renderOrder={-1}>
          <boxGeometry args={[1, 1, 1]} />
        </mesh>
        <mesh ref={leftBlock} material={extras.leftMaterials} renderOrder={-1}>
          <boxGeometry args={[1, 1, 1]} />
        </mesh>

        {LEAF_DEFS.map((def, index) => (
          <group key={def.front}>
            <mesh geometry={leaves[index].geometry} userData={{ face: def.front }} frustumCulled={false} {...hit}>
              <meshLambertMaterial map={faces[def.front].texture} side={FrontSide} alphaTest={0.5} />
            </mesh>
            <mesh geometry={leaves[index].geometry} userData={{ face: def.back }} frustumCulled={false} {...hit}>
              <meshLambertMaterial map={faces[def.back].texture} side={BackSide} alphaTest={0.5} />
            </mesh>
          </group>
        ))}
      </group>
    </>
  )
}

/** 案卷册的 WebGL 场景：按需渲染，只在翻页、悬停、重绘与缩放时出帧。 */
export default function CaseBookScene(props: CaseBookSceneProps) {
  return (
    <Canvas
      frameloop='demand'
      dpr={[1, 2]}
      flat
      camera={{ fov: FOV, position: [0, 0, 2000] }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      className='absolute! inset-0 z-10'
    >
      <Book {...props} />
    </Canvas>
  )
}
