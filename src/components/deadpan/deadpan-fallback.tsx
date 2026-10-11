import { DeadpanAsk } from './deadpan-ask'
import { DeadpanBoard } from './deadpan-board'
import { DeadpanCatalog } from './deadpan-catalog'
import { DeadpanFinale } from './deadpan-finale'
import { DeadpanHero } from './deadpan-hero'
import { DeadpanPaper } from './deadpan-paper'
import { DeskTravel } from './desk-travel'

/** 积案拂尘页的降级版本：窄屏、减少动态效果或无 WebGL 时的竖排区块。 */
export function DeadpanFallback() {
  return (
    <>
      <DeadpanHero />
      <DeadpanCatalog />
      <DeadpanBoard />
      <DeadpanAsk />
      <DeadpanPaper />
      <DeadpanFinale />
      <DeskTravel />
    </>
  )
}
