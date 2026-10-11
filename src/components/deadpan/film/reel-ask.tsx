import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import { FilmSection } from './film-section'
import { ChapterColumn, MARGIN, NoteColumn, PlateCaption, RunningHead } from './paper-kit'

/** 03 盘问 · 空桌：一张桌、两把椅子、一盏晃动的吊灯。 */
export function ReelAsk() {
  const { t } = useTranslation()
  return (
    <FilmSection
      id='ask'
      label={`03 ${t('dp.chapters.ask')}`}
      paper={
        <>
          <RunningHead chapter='03' name={t('dp.chapters.ask')} page={4} />
          <ChapterColumn chapter='03' name={t('dp.chapters.ask')} />
          <NoteColumn>
            <p>{t('pillars.oneBody')}</p>
          </NoteColumn>
          <PlateCaption caption={t('dp.film.captionTable')} />
        </>
      }
    >
      <div
        className={cn('pointer-events-none absolute inset-0 flex flex-col justify-between pt-[16vh] pb-[11vh]', MARGIN)}
        style={{ opacity: 'clamp(0, calc((var(--open) - .85) * 8), 1)' }}
      >
        <p className='w-fit bg-[#120d09] px-3 py-1.5 font-mono text-[.66rem] tracking-[.3em] uppercase'>
          <span className='text-accent'>(03)</span> {t('dp.chapters.ask')} — {t('deadpan.meta1')}
        </p>
        <div>
          <h2 className='font-serif-sc text-[clamp(3rem,10.5cqw,12rem)] leading-[.95] font-black tracking-[-.02em] [-webkit-text-stroke:.05em_#120d09] [paint-order:stroke_fill]'>
            {t('pillars.oneTitle')}
          </h2>
          <p className='mt-[3vh] w-fit max-w-[40rem] bg-[#120d09] px-4 py-3 font-serif-sc text-[clamp(1rem,1.5cqw,1.45rem)] leading-[1.9] text-pretty'>
            {t('pillars.oneBody')}
          </p>
        </div>
      </div>
    </FilmSection>
  )
}
