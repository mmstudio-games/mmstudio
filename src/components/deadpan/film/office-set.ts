import {
  AmbientLight,
  BoxGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  InstancedMesh,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  SpotLight,
} from 'three'

/** 卷宗架上留给真实案卷的那一层与起止跨。 */
const CASE_LEVEL = 1.32
const CASE_BAYS: [number, number] = [2, 5]
const BAY = 1.5
const STACKS_X0 = -4.4
const STACKS_Z = -3.72
const STACKS_DEPTH = 0.44
const LEVELS = [0.12, 0.72, 1.32, 1.92, 2.52, 3.12]

export const SPINE_PULL = 0.15

export type OfficeSet = ReturnType<typeof buildOffice>

/** 固定种子的随机数，保证每次进入页面屋里的陈设都一样。 */
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

type Item = { x: number; y: number; w: number; h: number; d: number; lean: number; tone: number }

/**
 * 江城旧案复核室：一间屋子，窗边案桌、整面卷宗架、屋子另一头的空桌。
 * 所有物件只用灰度材质（木刻着色只看明暗），红色材质留给第二块版。
 */
export function buildOffice(caseCount: number) {
  const rand = seeded(20261011)
  const scene = new Scene()
  scene.background = new Color(0x000000)
  const materials = new Map<string, MeshLambertMaterial>()
  const geometries: (BoxGeometry | CylinderGeometry | PlaneGeometry | SphereGeometry)[] = []
  const unit = new BoxGeometry(1, 1, 1)
  geometries.push(unit)

  const gray = (tone: number) => {
    const key = tone.toFixed(2)
    let material = materials.get(key)
    if (!material) {
      material = new MeshLambertMaterial({ color: new Color(tone, tone, tone) })
      materials.set(key, material)
    }
    return material
  }
  const red = new MeshLambertMaterial({ color: new Color(0.95, 0.07, 0.04) })
  materials.set('red', red)

  type BoxOptions = { ry?: number; rx?: number; rz?: number; cast?: boolean; material?: Material }
  const box = (
    parent: Object3D,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    tone = 0.6,
    options: BoxOptions = {},
  ) => {
    const mesh = new Mesh(unit, options.material ?? gray(tone))
    mesh.scale.set(w, h, d)
    mesh.position.set(x, y, z)
    mesh.rotation.set(options.rx ?? 0, options.ry ?? 0, options.rz ?? 0)
    mesh.castShadow = options.cast !== false
    mesh.receiveShadow = true
    parent.add(mesh)
    return mesh
  }
  const cylinder = (
    parent: Object3D,
    top: number,
    bottom: number,
    h: number,
    x: number,
    y: number,
    z: number,
    tone = 0.6,
    open = false,
  ) => {
    const geometry = new CylinderGeometry(top, bottom, h, 24, 1, open)
    geometries.push(geometry)
    let material: MeshLambertMaterial = gray(tone)
    if (open) {
      material = new MeshLambertMaterial({ color: new Color(tone, tone, tone), side: DoubleSide })
      materials.set(`open-${materials.size}`, material)
    }
    const mesh = new Mesh(geometry, material)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    parent.add(mesh)
    return mesh
  }

  // ---- 屋子的壳 ----
  const floorGeometry = new PlaneGeometry(18, 13)
  geometries.push(floorGeometry)
  const floor = new Mesh(floorGeometry, gray(0.62))
  floor.rotation.x = -Math.PI / 2
  floor.position.set(1, 0, 1.5)
  floor.receiveShadow = true
  scene.add(floor)
  box(scene, 18, 4.4, 0.2, 1, 2.2, -4.1, 0.5)
  // 左墙，留出窗洞（z -1.6..0.6，y 1.05..3.0）
  box(scene, 0.2, 4.4, 2.4, -6.1, 2.2, -2.8, 0.5)
  box(scene, 0.2, 4.4, 7.4, -6.1, 2.2, 4.3, 0.5)
  box(scene, 0.2, 1.05, 2.2, -6.1, 0.525, -0.5, 0.5)
  box(scene, 0.2, 1.4, 2.2, -6.1, 3.7, -0.5, 0.5)
  box(scene, 0.08, 0.06, 2.2, -6.0, 3.0, -0.5, 0.7)
  box(scene, 0.08, 0.06, 2.2, -6.0, 1.05, -0.5, 0.7)
  for (const z of [-1.6, -0.5, 0.6]) box(scene, 0.06, 1.95, 0.05, -6.0, 2.025, z, 0.7)
  box(scene, 0.06, 0.04, 2.2, -6.0, 2.05, -0.5, 0.7)
  box(scene, 0.32, 0.05, 2.4, -5.9, 1.03, -0.5, 0.75)
  for (let i = 0; i < 12; i++) box(scene, 0.1, 0.62, 0.06, -5.9, 0.45, -1.35 + i * 0.155, 0.7)
  box(scene, 18, 0.14, 0.04, 1, 0.07, -3.98, 0.4)

  // 窗外的天：夜里几乎是黑的，收尾时亮成一片白
  const skyGeometry = new PlaneGeometry(3.4, 3)
  geometries.push(skyGeometry)
  const skyMaterial = new MeshBasicMaterial({ color: 0x000000 })
  const sky = new Mesh(skyGeometry, skyMaterial)
  sky.rotation.y = Math.PI / 2
  sky.position.set(-6.5, 2.05, -0.5)
  scene.add(sky)

  // ---- 卷宗架 ----
  const items: Item[] = []
  const spines: Mesh[] = []
  const spineHome: number[] = []
  const fill = (from: number, to: number, y: number, depth: number, into: Item[]) => {
    let x = from
    const bound = rand() < 0.45
    while (x < to - 0.05) {
      if (rand() < 0.08) {
        x += 0.08 + rand() * 0.25
        continue
      }
      const w = bound ? 0.07 + rand() * 0.05 : 0.2 + rand() * 0.12
      const h = bound ? 0.38 + rand() * 0.14 : 0.3 + rand() * 0.05
      if (x + w > to) break
      const lean = rand() < 0.06 ? (rand() - 0.5) * 0.35 : 0
      into.push({
        x: x + w / 2,
        y: y + 0.02 + h / 2,
        w,
        h,
        d: depth * (0.7 + rand() * 0.2),
        lean,
        tone: 0.35 + rand() * 0.45,
      })
      x += w + 0.006 + (lean ? 0.06 : 0)
    }
  }
  const frame = (parent: Object3D, x0: number, bays: number, z: number, depth: number) => {
    const x1 = x0 + bays * BAY
    const top = 3.7
    for (let i = 0; i <= bays; i++) box(parent, 0.06, top, depth, x0 + i * BAY, top / 2, z, 0.5)
    for (const y of LEVELS) box(parent, x1 - x0, 0.04, depth, (x0 + x1) / 2, y, z, 0.55)
    box(parent, x1 - x0, 0.06, depth, (x0 + x1) / 2, top, z, 0.5)
    box(parent, x1 - x0, top, 0.02, (x0 + x1) / 2, top / 2, z - depth / 2, 0.25)
  }
  const stock = (parent: Object3D, list: Item[], z: number, depth: number) => {
    const boxes = new InstancedMesh(unit, new MeshLambertMaterial({ color: 0xffffff }), list.length)
    const labelled = list.filter((item) => item.w > 0.15 && !item.lean)
    const labels = new InstancedMesh(unit, new MeshLambertMaterial({ color: 0xffffff }), labelled.length)
    materials.set(`stock-${materials.size}`, boxes.material as MeshLambertMaterial)
    materials.set(`stock-${materials.size}`, labels.material as MeshLambertMaterial)
    const dummy = new Object3D()
    const color = new Color()
    list.forEach((item, i) => {
      dummy.position.set(item.x, item.y, z + (depth - item.d) / 2 - 0.02)
      dummy.rotation.set(0, 0, item.lean)
      dummy.scale.set(item.w, item.h, item.d)
      dummy.updateMatrix()
      boxes.setMatrixAt(i, dummy.matrix)
      boxes.setColorAt(i, color.setRGB(item.tone, item.tone, item.tone))
    })
    labelled.forEach((item, i) => {
      dummy.position.set(item.x, item.y + item.h * 0.12, z + depth / 2 - 0.016)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(item.w * 0.62, item.h * 0.34, 0.004)
      dummy.updateMatrix()
      labels.setMatrixAt(i, dummy.matrix)
      labels.setColorAt(i, color.setRGB(0.95, 0.95, 0.95))
    })
    boxes.castShadow = true
    boxes.receiveShadow = true
    labels.receiveShadow = true
    parent.add(boxes, labels)
  }

  const stackBays = 7
  frame(scene, STACKS_X0, stackBays, STACKS_Z, STACKS_DEPTH)
  // 真实案卷：从预留的跨里依次排开，每宗一条卷脊，可单独抽出
  const spineWidth = caseCount > 30 ? 0.108 : 0.122
  let placed = 0
  for (let bay = 0; bay < stackBays; bay++) {
    for (const y of LEVELS) {
      const from = STACKS_X0 + bay * BAY + 0.07
      const to = STACKS_X0 + (bay + 1) * BAY - 0.07
      let cursor = from
      if (y === CASE_LEVEL && bay >= CASE_BAYS[0] && bay <= CASE_BAYS[1]) {
        while (placed < caseCount && cursor + spineWidth < to) {
          const height = 0.46 + rand() * 0.03
          const tone = 0.86
          const spine = new Mesh(unit, gray(tone))
          spine.scale.set(spineWidth - 0.012, height, 0.3)
          spine.position.set(cursor + spineWidth / 2, y + 0.02 + height / 2, STACKS_Z + 0.05)
          spine.castShadow = true
          spine.receiveShadow = true
          spine.userData.index = placed
          spine.userData.material = gray(tone)
          // 卷脊上的签条
          const tag = new Mesh(unit, gray(0.95))
          tag.scale.set(0.62, 0.3, 0.02)
          tag.position.set(0, 0.08, 0.51)
          tag.receiveShadow = true
          // 卷脊上下各一道深色的装订布
          for (const y of [0.4, -0.42]) {
            const band = new Mesh(unit, gray(0.16))
            band.scale.set(1.02, 0.09, 1.02)
            band.position.set(0, y, 0)
            band.receiveShadow = true
            spine.add(band)
          }
          spine.add(tag)
          scene.add(spine)
          spines.push(spine)
          spineHome.push(spine.position.z)
          cursor += spineWidth
          placed++
        }
        cursor += 0.05
      }
      fill(cursor, to, y, STACKS_DEPTH, items)
    }
  }
  stock(scene, items, STACKS_Z, STACKS_DEPTH)

  // 右侧一排立架，把屋子收住
  const side = new Group()
  side.position.set(7.2, 0, -0.9)
  side.rotation.y = -Math.PI / 2
  scene.add(side)
  frame(side, -3, 4, 0, STACKS_DEPTH)
  const sideItems: Item[] = []
  for (let bay = 0; bay < 4; bay++) {
    for (const y of LEVELS) fill(-3 + bay * BAY + 0.07, -3 + (bay + 1) * BAY - 0.07, y, STACKS_DEPTH, sideItems)
  }
  stock(side, sideItems, 0, STACKS_DEPTH)

  // 梯子
  const ladder = new Group()
  ladder.position.set(5.35, 0, -2.75)
  ladder.rotation.x = -0.24
  scene.add(ladder)
  box(ladder, 0.05, 3.5, 0.07, -0.24, 1.75, 0, 0.8)
  box(ladder, 0.05, 3.5, 0.07, 0.24, 1.75, 0, 0.8)
  for (let i = 0; i < 10; i++) box(ladder, 0.48, 0.035, 0.05, 0, 0.3 + i * 0.33, 0, 0.8)

  // 档案柜
  for (let i = 0; i < 2; i++) {
    const x = -5.55 + i * 0.52
    box(scene, 0.5, 1.35, 0.62, x, 0.675, -3.6, 0.55)
    for (let k = 0; k < 4; k++) {
      box(scene, 0.44, 0.29, 0.02, x, 0.2 + k * 0.325, -3.285, 0.68)
      box(scene, 0.12, 0.02, 0.03, x, 0.24 + k * 0.325, -3.265, 0.9)
    }
  }
  box(scene, 0.34, 0.26, 0.42, -5.5, 1.48, -3.6, 0.6, { ry: 0.2 })

  // 散在地上的纸箱
  box(scene, 0.5, 0.34, 0.38, -2.4, 0.17, -2.9, 0.62, { ry: 0.3 })
  box(scene, 0.5, 0.34, 0.38, -2.35, 0.51, -2.92, 0.55, { ry: -0.1 })
  box(scene, 0.5, 0.34, 0.38, 6.1, 0.17, -2.5, 0.5, { ry: 0.9 })
  box(scene, 0.36, 0.05, 0.27, 6.1, 0.37, -2.5, 0.9, { ry: 0.7 })

  // ---- 窗边的案桌 ----
  const desk = new Group()
  desk.position.set(-3.5, 0, 0.3)
  desk.rotation.y = 0.32
  scene.add(desk)
  box(desk, 1.9, 0.05, 0.95, 0, 0.76, 0, 0.72)
  box(desk, 1.8, 0.1, 0.86, 0, 0.69, 0, 0.5)
  box(desk, 0.5, 0.62, 0.84, -0.66, 0.33, 0, 0.5)
  box(desk, 0.5, 0.62, 0.84, 0.66, 0.33, 0, 0.5)
  for (let k = 0; k < 3; k++) {
    for (const x of [-0.66, 0.66]) {
      box(desk, 0.44, 0.17, 0.02, x, 0.14 + k * 0.2, 0.43, 0.66)
      box(desk, 0.1, 0.02, 0.03, x, 0.16 + k * 0.2, 0.45, 0.9)
    }
  }
  // 卷宗（系朱红腰封）、稿纸、茶缸、打字机
  const dossier = box(desk, 0.36, 0.035, 0.5, 0.05, 0.805, 0.08, 0.8, { ry: -0.18 })
  box(desk, 0.362, 0.006, 0.07, 0.05, 0.826, 0.08, 0.9, { ry: -0.18, material: red })
  box(desk, 0.3, 0.004, 0.42, -0.42, 0.79, 0.12, 0.95, { ry: 0.3 })
  box(desk, 0.3, 0.004, 0.42, -0.36, 0.794, 0.06, 0.9, { ry: 0.08 })
  cylinder(desk, 0.045, 0.04, 0.1, 0.48, 0.835, 0.25, 0.85)
  box(desk, 0.42, 0.1, 0.36, 0.6, 0.835, -0.16, 0.4, { ry: -0.25 })
  box(desk, 0.38, 0.08, 0.14, 0.61, 0.92, -0.26, 0.35, { ry: -0.25 })
  cylinder(desk, 0.03, 0.03, 0.4, 0.61, 0.99, -0.27, 0.7).rotation.z = Math.PI / 2
  box(desk, 0.3, 0.26, 0.004, 0.62, 1.08, -0.3, 0.95, { ry: -0.25, rx: -0.2 })
  // 台灯
  cylinder(desk, 0.1, 0.12, 0.03, -0.72, 0.8, -0.3, 0.6)
  box(desk, 0.02, 0.48, 0.02, -0.72, 1.03, -0.3, 0.7, { rz: -0.2 })
  box(desk, 0.02, 0.4, 0.02, -0.6, 1.36, -0.3, 0.7, { rz: -1.05 })
  cylinder(desk, 0.05, 0.17, 0.2, -0.38, 1.4, -0.24, 0.85, true).rotation.set(0.35, 0, -0.5)
  const deskLight = new SpotLight(0xffffff, 14, 6, 1.05, 0.6, 1.7)
  deskLight.position.set(-0.4, 1.4, -0.25)
  deskLight.target.position.set(0.05, 0.78, 0.12)
  deskLight.castShadow = true
  deskLight.shadow.mapSize.set(1024, 1024)
  deskLight.shadow.bias = -0.002
  deskLight.shadow.radius = 5
  desk.add(deskLight, deskLight.target)
  // 椅子
  const chair = (parent: Object3D, x: number, z: number, ry: number) => {
    const group = new Group()
    group.position.set(x, 0, z)
    group.rotation.y = ry
    parent.add(group)
    box(group, 0.46, 0.05, 0.44, 0, 0.47, 0, 0.6)
    box(group, 0.46, 0.5, 0.04, 0, 0.82, 0.2, 0.6)
    for (const [lx, lz] of [
      [-0.2, -0.19],
      [0.2, -0.19],
      [-0.2, 0.19],
      [0.2, 0.19],
    ]) {
      box(group, 0.04, 0.47, 0.04, lx, 0.235, lz, 0.55)
    }
    return group
  }
  chair(desk, 0.1, 0.95, 0.5)

  // ---- 屋子另一头的空桌（盘问） ----
  const table = new Group()
  table.position.set(3.4, 0, 3.4)
  scene.add(table)
  box(table, 1.5, 0.05, 0.8, 0, 0.75, 0, 0.75)
  for (const [lx, lz] of [
    [-0.68, -0.33],
    [0.68, -0.33],
    [-0.68, 0.33],
    [0.68, 0.33],
  ]) {
    box(table, 0.06, 0.73, 0.06, lx, 0.365, lz, 0.6)
  }
  box(table, 1.3, 0.08, 0.04, 0, 0.66, -0.33, 0.55)
  box(table, 1.3, 0.08, 0.04, 0, 0.66, 0.33, 0.55)
  box(table, 0.3, 0.004, 0.21, -0.12, 0.777, 0.02, 0.95, { ry: 0.12 })
  cylinder(table, 0.05, 0.045, 0.012, 0.4, 0.781, -0.12, 0.8)
  chair(table, -0.05, -0.85, Math.PI + 0.12)
  chair(table, 0.1, 0.9, -0.28)
  // 会晃的吊灯：支点在天花板
  const swingPivot = new Group()
  swingPivot.position.set(3.4, 4.2, 3.4)
  scene.add(swingPivot)
  box(swingPivot, 0.012, 2.1, 0.012, 0, -1.05, 0, 0.3, { cast: false })
  cylinder(swingPivot, 0.05, 0.3, 0.2, 0, -2.2, 0, 0.85, true)
  const bulbGeometry = new SphereGeometry(0.05, 12, 8)
  geometries.push(bulbGeometry)
  const bulbMaterial = new MeshBasicMaterial({ color: 0xffffff })
  const swingBulb = new Mesh(bulbGeometry, bulbMaterial)
  swingBulb.position.set(0, -2.26, 0)
  swingPivot.add(swingBulb)
  const swingLight = new SpotLight(0xffffff, 0, 8, 1.0, 0.5, 1.5)
  swingLight.position.set(0, -2.24, 0)
  swingLight.target.position.set(0, -5, 0)
  swingLight.castShadow = true
  swingLight.shadow.mapSize.set(1024, 1024)
  swingLight.shadow.bias = -0.0015
  swingLight.shadow.radius = 4
  swingPivot.add(swingLight, swingLight.target)

  // ---- 灯 ----
  const pendant = (x: number, z: number, shadow: boolean) => {
    const group = new Group()
    group.position.set(x, 0, z)
    scene.add(group)
    box(group, 0.012, 1.5, 0.012, 0, 3.45, 0, 0.3, { cast: false })
    cylinder(group, 0.05, 0.3, 0.2, 0, 2.62, 0, 0.85, true)
    const bulb = new Mesh(bulbGeometry, bulbMaterial)
    bulb.position.set(0, 2.56, 0)
    group.add(bulb)
    const light = new SpotLight(0xffffff, 0, 9, 1.26, 0.7, 1.6)
    light.position.set(0, 2.58, 0)
    light.target.position.set(0, 0, 0)
    group.add(light, light.target)
    if (shadow) {
      light.castShadow = true
      light.shadow.mapSize.set(1024, 1024)
      light.shadow.bias = -0.0015
      light.shadow.radius = 4
    }
    return light
  }
  const pendants = [pendant(-0.65, -2.45, true), pendant(2.35, -2.45, true), pendant(5.35, -2.45, false)]

  const moon = new DirectionalLight(0xffffff, 2.6)
  moon.position.set(-13, 6.5, -1.2)
  moon.target.position.set(-2.5, 0, 0.4)
  moon.castShadow = true
  moon.shadow.mapSize.set(2048, 2048)
  moon.shadow.camera.left = -9
  moon.shadow.camera.right = 9
  moon.shadow.camera.top = 7
  moon.shadow.camera.bottom = -7
  moon.shadow.camera.near = 1
  moon.shadow.camera.far = 34
  moon.shadow.bias = -0.0015
  moon.shadow.radius = 3
  scene.add(moon, moon.target)

  // 访客手里的手电：跟着指针，不投影
  const torch = new SpotLight(0xffffff, 0, 16, 0.17, 0.9, 0.8)
  scene.add(torch, torch.target)

  const ambient = new AmbientLight(0xffffff, 0.06)
  scene.add(ambient)

  // 投影贴图逐灯按需更新：引擎在灯或物体变化时点名重画
  for (const light of [deskLight, moon, swingLight, ...pendants]) light.shadow.autoUpdate = false

  let pulled: number | null = null
  const pull = new Array<number>(spines.length).fill(0)

  return {
    scene,
    dossier,
    spines,
    swingPivot,
    lights: { desk: deskLight, moon, pendants, swing: swingLight, torch, ambient },
    /** 窗外天光的亮度 0..1。 */
    setSky(value: number) {
      skyMaterial.color.setScalar(value)
    },
    /** 选中一条卷脊（悬停或聚焦）：它印成朱红并抽出半截。返回是否有变化。 */
    select(index: number | null) {
      if (index === pulled) return false
      if (pulled !== null) spines[pulled].material = spines[pulled].userData.material as Material
      pulled = index
      if (index !== null) spines[index].material = red
      return true
    },
    /** 推进卷脊抽出的动画，返回是否还在动。 */
    stepSpines(delta: number) {
      let moving = false
      for (let i = 0; i < spines.length; i++) {
        const target = i === pulled ? 1 : 0
        const next = pull[i] + (target - pull[i]) * Math.min(1, delta * 9)
        if (Math.abs(next - pull[i]) > 0.0005) moving = true
        pull[i] = Math.abs(target - next) < 0.001 ? target : next
        spines[i].position.z = spineHome[i] + pull[i] * SPINE_PULL
      }
      return moving
    },
    dispose() {
      for (const geometry of geometries) geometry.dispose()
      for (const material of materials.values()) material.dispose()
      bulbMaterial.dispose()
      skyMaterial.dispose()
      for (const light of [deskLight, moon, swingLight, ...pendants]) light.shadow?.map?.dispose()
    },
  }
}
