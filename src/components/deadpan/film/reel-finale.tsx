import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import { CATALOG_URL } from '../case-archive'
import { FilmSection } from './film-section'
import { ChapterColumn, MARGIN, NoteColumn, PlateCaption, RunningHead } from './paper-kit'

/** 收尾：台灯熄了，窗外天亮。影片在这里不再收回纸面，直接接页脚。 */
export function ReelFinale() {
  const { t, i18n } = useTranslation()
  const zh = i18n.language.startsWith('zh')
  return (
    <FilmSection
      id='finale'
      label={t('dp.film.finale')}
      paper={
        <>
          <RunningHead chapter='FIN' name={t('dp.film.finale')} page={6} />
          <ChapterColumn chapter='FIN' name={t('dp.film.finale')} />
          <NoteColumn>
            <p>{t('dp.film.lightsOut')}</p>
          </NoteColumn>
          <PlateCaption caption={t('dp.film.captionDawn')} />
        </>
      }
    >
      <div
        className={cn('absolute inset-0 flex flex-col justify-end pb-[12vh]', MARGIN)}
        style={{ opacity: 'clamp(0, calc((var(--t) - .5) * 5), 1)' }}
      >
        <p className='w-fit bg-[#120d09] px-4 py-2 font-serif-sc text-[clamp(1.3rem,2.6cqw,2.8rem)] font-bold'>
          {t('dp.finale.line')}
        </p>
        <a
          href={CATALOG_URL}
          target='_blank'
          rel='noreferrer'
          data-cursor={t('deadpan.play')}
          className={cn(
            'group mt-[1vh] flex w-fit items-start gap-[1.5cqw] font-serif-sc leading-[.9] font-black tracking-[-.03em] whitespace-nowrap text-paper no-underline transition-colors [-webkit-text-stroke:.04em_#120d09] [paint-order:stroke_fill] hover:text-accent',
            zh ? 'text-[clamp(5rem,22cqw,26rem)]' : 'text-[clamp(4rem,12.5cqw,15rem)]',
          )}
        >
          {t('dp.finale.cta')}
          <ArrowUpRight
            aria-hidden
            className='mt-[2cqw] size-[5cqw] transition-transform duration-500 ease-out-expo group-hover:translate-x-[1cqw] group-hover:-translate-y-[1cqw]'
          />
        </a>
        <p className='mt-[2.4vh] w-fit bg-[#120d09] px-3 py-1.5 font-mono text-[.66rem] tracking-[.26em] uppercase'>
          {t('dp.film.lightsOut')} — {t('dp.hero.office')}
        </p>
      </div>
    </FilmSection>
  )
}
