import { useEffect } from 'react'

import { DeadpanAsk } from '@/components/deadpan/deadpan-ask'
import { DeadpanBoard } from '@/components/deadpan/deadpan-board'
import { DeadpanCatalog } from '@/components/deadpan/deadpan-catalog'
import { DeadpanFinale } from '@/components/deadpan/deadpan-finale'
import { DeadpanHero } from '@/components/deadpan/deadpan-hero'
import { DeadpanPaper } from '@/components/deadpan/deadpan-paper'
import { DeskTravel } from '@/components/deadpan/desk-travel'

/** 积案拂尘：一宗积案，从落灰到见报。 */
export function DeadpanPage() {
  useEffect(() => {
    document.documentElement.dataset.stage = 'deadpan'
    return () => {
      delete document.documentElement.dataset.stage
    }
  }, [])

  return (
    <>
      <DeadpanHero />
      <DeadpanCatalog />
      <DeadpanAsk />
      <DeadpanBoard />
      <DeadpanPaper />
      <DeadpanFinale />
      <DeskTravel />
    </>
  )
}
