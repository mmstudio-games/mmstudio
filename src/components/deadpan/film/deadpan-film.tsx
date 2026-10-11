import { useEffect, useRef, useState } from 'react'

import { CASE_ARCHIVE } from '../case-archive'
import { DossierFolder } from './dossier-folder'
import { createFilmEngine } from './film-engine'
import { FilmScrubber } from './film-scrubber'
import { filmEngine } from './film-store'
import { PaperDeduce } from './paper-deduce'
import { PaperFront } from './paper-front'
import { FilmFilters } from './paper-kit'
import { PaperPress } from './paper-press'
import { PaperRecord } from './paper-record'
import { ReelAsk } from './reel-ask'
import { ReelDust } from './reel-dust'
import { ReelFinale } from './reel-finale'
import { ReelStacks } from './reel-stacks'

/**
 * 积案拂尘页（宽屏）：一份会动的《奇案特刊》。纸面与图版交替，图版里是一部木刻风影片。
 * 画布只有一块，固定在所有段落之下；各影片段的新闻纸在图版处留洞把它露出来。
 */
export default function DeadpanFilm({ onFail }: { onFail: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  const [opened, setOpened] = useState<number | null>(null)

  useEffect(() => {
    const element = canvas.current
    if (!element) return
    let engine: ReturnType<typeof createFilmEngine>
    try {
      engine = createFilmEngine({ canvas: element, caseCount: CASE_ARCHIVE.length, onLost: onFail })
    } catch {
      onFail()
      return
    }
    filmEngine.current = engine
    setReady(true)
    return () => {
      filmEngine.current = null
      setReady(false)
      engine.dispose()
    }
  }, [onFail])

  return (
    <div className='relative bg-[#120d09]'>
      <canvas
        ref={canvas}
        aria-hidden
        className='pointer-events-none fixed top-0 left-0 h-screen w-full origin-top-left'
        style={{ visibility: 'hidden' }}
      />
      <FilmFilters />
      <ReelDust />
      <PaperFront />
      <ReelStacks ready={ready} onOpen={setOpened} />
      <PaperDeduce />
      <ReelAsk />
      <PaperRecord />
      <PaperPress />
      <ReelFinale />
      <FilmScrubber />
      <DossierFolder index={opened} onClose={() => setOpened(null)} />
    </div>
  )
}
