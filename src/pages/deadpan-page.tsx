import { useEffect } from 'react'
import { DeadpanCaseBook } from '@/components/deadpan/case-book'

/** 积案拂尘：一宗积案，从落灰到见报。 */
export function DeadpanPage() {
  useEffect(() => {
    document.documentElement.dataset.stage = 'deadpan'
    return () => {
      delete document.documentElement.dataset.stage
    }
  }, [])

  return <DeadpanCaseBook />
}
