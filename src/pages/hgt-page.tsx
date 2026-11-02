import { lazy, Suspense, useEffect } from 'react'

// 整页是一部「电影」，代码按需加载，不拖慢其他页面
const HgtFilm = lazy(() => import('@/components/hgt/hgt-film'))

/** 海龟汤调查局：一块吸顶画面，五幕，四段剪辑转场。 */
export function HgtPage() {
  useEffect(() => {
    document.documentElement.dataset.stage = 'hgt'
    return () => {
      delete document.documentElement.dataset.stage
    }
  }, [])

  return (
    <Suspense fallback={<div className='-mt-[72px] h-svh bg-[#f2efe6]' />}>
      <HgtFilm />
    </Suspense>
  )
}
