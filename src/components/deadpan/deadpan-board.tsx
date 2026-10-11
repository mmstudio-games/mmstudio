import { useTranslation } from 'react-i18next'

import { SectionLabel } from '@/components/site/section-label'

import { ClueWall } from './clue-wall'

/** 推理 · 线索墙（降级版）：不用书的窄屏、减少动态效果或无 WebGL 时的独立区块。 */
export function DeadpanBoard() {
  const { t } = useTranslation()

  return (
    <section
      aria-labelledby='dp-board-title'
      className='grid gap-12 px-[clamp(1.25rem,4vw,4.5rem)] py-[clamp(6rem,11vw,10rem)] lg:grid-cols-[minmax(0,24rem)_1fr]'
    >
      <div className='flex flex-col gap-8'>
        <SectionLabel index='02' label={`${t('dp.chapters.deduce')} / ${t('deadpan.meta3')}`} />
        <h2
          id='dp-board-title'
          className='font-serif-sc text-[clamp(2.6rem,5vw,4.6rem)] leading-[1.05] font-black tracking-[.02em]'
        >
          {t('pillars.twoTitle')}
        </h2>
        <p className='text-[1rem] leading-[1.85] text-muted-foreground'>{t('pillars.twoBody')}</p>
        <p className='flex items-center gap-3 font-mono text-[.64rem] tracking-[.18em] text-muted-foreground uppercase'>
          <span className='size-1.5 bg-accent' />
          {t('dp.board.hint')}
        </p>
      </div>

      <ClueWall className='h-[min(78svh,680px)] min-h-[520px] border border-border bg-[#231a12] bg-[radial-gradient(circle,rgba(236,220,188,.08)_1px,transparent_1px)] bg-[size:22px_22px]' />
    </section>
  )
}
