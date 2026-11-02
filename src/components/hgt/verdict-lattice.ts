/**
 * 第二幕的背景：一棵整齐的猜测树。主干从画面底部正中出发，每一层一分为二，五层后成为 32 条等距的竖线，直通画面顶部。
 * 竖线按落点分成三组，分别响应「无关」「不是」「是，也不是」；主干本身留给「是」。
 * 坐标系为 1600 × 1000，居中裁切铺满画面。四块翻牌挡住中段，所以分岔、闸门与折角都放在翻牌以下。
 */

export type LatticeGroup = 'irrelevant' | 'no' | 'both' | 'mixed'
/** tail 为真的是竖线（画得更淡），否则是分岔。 */
export type LatticePath = {
  d: string
  group: LatticeGroup
  part: 'all' | 'below' | 'above' | 'straight' | 'bent'
  tail?: boolean
}

const LEVELS = 5
const LEAVES = 2 ** LEVELS
const ROOT_Y = 965
const STEP = 45
/** 最后一层分岔的高度：竖线从这里出发。 */
const LEAF_Y = ROOT_Y - LEVELS * STEP

export const LATTICE = { width: 1600, height: 1000, spine: 800, gate: 690 } as const

const leafX = (i: number) => (LATTICE.width / LEAVES) * (i + 0.5)

function groupOf(x: number): LatticeGroup {
  const third = LATTICE.width / 3
  if (x < third || x > LATTICE.width - third) return 'irrelevant'
  return x < LATTICE.spine ? 'no' : 'both'
}

export function buildLattice() {
  const paths: LatticePath[] = []

  // 分岔：第 k 层有 2^k 个节点，每个节点覆盖一段连续的竖线，位置取它们的中点
  for (let level = 0; level < LEVELS; level++) {
    const count = 2 ** level
    const span = LEAVES / count
    for (let node = 0; node < count; node++) {
      const first = node * span
      const x = (leafX(first) + leafX(first + span - 1)) / 2
      const y = ROOT_Y - level * STEP
      for (const half of [0, 1]) {
        const childFirst = first + half * (span / 2)
        const childLast = childFirst + span / 2 - 1
        const cx = (leafX(childFirst) + leafX(childLast)) / 2
        const a = groupOf(leafX(childFirst))
        const b = groupOf(leafX(childLast))
        paths.push({ d: `M${x} ${y}H${cx}V${y - STEP}`, group: a === b ? a : 'mixed', part: 'all' })
      }
    }
  }

  // 竖线：从最后一层分岔直通画面顶部
  let bent = 0
  for (let i = 0; i < LEAVES; i++) {
    const x = leafX(i)
    const group = groupOf(x)
    if (group === 'no') {
      paths.push({ d: `M${x} ${LEAF_Y}V${LATTICE.gate}`, group, part: 'below', tail: true })
      paths.push({ d: `M${x} ${LATTICE.gate}V-20`, group, part: 'above', tail: true })
    } else if (group === 'both') {
      paths.push({ d: `M${x} ${LEAF_Y}V-20`, group, part: 'straight', tail: true })
      // 是，也不是：走到半路折一个直角，横着出画；折角的高度逐条错开
      paths.push({
        d: `M${x} ${LEAF_Y}V${LEAF_Y - 24 - bent * 18}H${LATTICE.width + 20}`,
        group,
        part: 'bent',
        tail: true,
      })
      bent++
    } else {
      paths.push({ d: `M${x} ${LEAF_Y}V-20`, group, part: 'all', tail: true })
    }
  }
  return paths
}
