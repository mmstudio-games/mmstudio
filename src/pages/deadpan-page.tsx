import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'

import { DeadpanFallback } from '@/components/deadpan/deadpan-fallback'
import { useMediaQuery, useReducedMotion } from '@/hooks/use-media-query'

/** 影片版只在够宽、够高的视口里出现。 */
const FILM_VIEWPORT = '(min-width: 900px) and (min-height: 560px)'

// 影片引擎带着 three.js，按需加载
const DeadpanFilm = lazy(() => import('@/components/deadpan/film/deadpan-film'))

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2'))
  } catch {
    return false
  }
}

/** 积案拂尘：一份会动的《奇案特刊》；窄屏、减少动态效果或无 WebGL 时是竖排区块。 */
export function DeadpanPage() {
  const wide = useMediaQuery(FILM_VIEWPORT)
  const reduced = useReducedMotion()
  const webgl = useMemo(supportsWebGL, [])
  const [failed, setFailed] = useState(false)
  const film = wide && !reduced && webgl && !failed
  const fail = useCallback(() => setFailed(true), [])

  useEffect(() => {
    document.documentElement.dataset.stage = 'deadpan'
    return () => {
      delete document.documentElement.dataset.stage
    }
  }, [])

  // 两种形态高度不同，切换后重新计算滚动触发点
  // biome-ignore lint/correctness/useExhaustiveDependencies: film 只是触发重算的信号
  useEffect(() => {
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(frame)
  }, [film])

  if (!film) return <DeadpanFallback />
  return (
    <Suspense fallback={<div className='-mt-[72px] h-screen bg-[#120d09]' />}>
      <DeadpanFilm onFail={fail} />
    </Suspense>
  )
}
