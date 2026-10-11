import { useTranslation } from 'react-i18next'

import { ClueWall } from '../clue-wall'
import { Rule } from './paper-kit'
import { ChapterHead, PaperSection } from './paper-section'

/** 02 推理：线索墙钉在报纸上的一块黑版里，卡片可拖，红线跟着走。 */
export function PaperDeduce() {
  const { t } = useTranslation()
  return (
    <PaperSection id='deduce' label={`02 ${t('dp.chapters.deduce')}`} className='pt-[16vh] pb-[16vh]'>
      <ChapterHead chapter='02' name={t('dp.chapters.deduce')} note={<p>{t('dp.film.wallNote')}</p>} />

      <div className='grid grid-cols-12 gap-x-[2.4vw] py-[7vh]'>
        <p className='col-span-2 font-mono text-[.62rem] leading-loose tracking-[.24em] uppercase'>
          <span className='text-seal'>(02)</span> {t('deadpan.meta3')}
          <br />
          {t('deadpan.meta2')}
        </p>
        <h3 className='col-span-5 font-serif-sc text-[clamp(2rem,4.4vw,4.8rem)] leading-[1.08] font-black'>
          {t('pillars.twoTitle')}
        </h3>
        <p className='col-span-4 col-start-9 self-end font-serif-sc text-[1.05rem] leading-[1.95]'>
          {t('pillars.twoBody')}
        </p>
      </div>

      <Rule />
      <div className='flex items-baseline justify-between py-[1.6vh] font-mono text-[.62rem] tracking-[.24em] uppercase'>
        <span>{t('dp.book.wall')}</span>
        <span className='flex items-center gap-3'>
          <span aria-hidden className='size-1.5 bg-seal' />
          {t('dp.board.hint')}
        </span>
      </div>
      <ClueWall className='h-[min(82vh,760px)] min-h-[540px] w-full border-[10px] border-ink bg-[#17120d] bg-[radial-gradient(circle,rgba(230,207,170,.09)_1px,transparent_1px)] bg-[size:22px_22px]' />
    </PaperSection>
  )
}
