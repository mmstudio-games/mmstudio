import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Magnetic } from '@/components/motion/magnetic'

import { CASE_ARCHIVE, CATALOG_URL } from '../case-archive'
import { Rule, Seal } from './paper-kit'
import { ChapterHead, PaperSection } from './paper-section'

const GAME_URL = 'https://deadpan.hydroroll.team/'

const THREE = [
  { tag: 'deadpan.meta1', title: 'pillars.oneTitle', body: 'pillars.oneBody' },
  { tag: 'deadpan.meta2', title: 'pillars.twoTitle', body: 'pillars.twoBody' },
  { tag: 'deadpan.meta3', title: 'pillars.threeTitle', body: 'pillars.threeBody' },
] as const

const LOOP = ['dp.film.loop1', 'dp.film.loop2', 'dp.film.loop3', 'dp.film.loop4', 'dp.film.loop5'] as const

/** 头版 · 01 开卷：导语、三项特点、一宗案子的走法，最后引到卷宗架。 */
export function PaperFront() {
  const { t } = useTranslation()
  return (
    <PaperSection id='front' label={`01 ${t('dp.chapters.open')}`} className='pb-[14vh]'>
      {/* 导语 */}
      <div className='grid grid-cols-12 gap-x-[2.4vw] pt-[6vh] pb-[9vh]'>
        <div className='col-span-2 flex flex-col items-start gap-6'>
          <p className='font-mono text-[.62rem] leading-loose tracking-[.24em] uppercase'>
            <span className='text-seal'>(01)</span> {t('dp.chapters.open')}
            <br />
            {t('deadpan.label')}
          </p>
          <Seal className='text-[.95rem]'>{t('deadpan.status')}</Seal>
        </div>
        <p className='col-span-7 font-serif-sc text-[clamp(1.35rem,2.5vw,2.7rem)] leading-[1.62] font-semibold'>
          {t('deadpan.description')}
        </p>
        <div className='col-span-3 flex flex-col items-end justify-end gap-5'>
          <Magnetic>
            <a
              href={GAME_URL}
              target='_blank'
              rel='noreferrer'
              data-cursor={t('deadpan.play')}
              className='group flex items-center gap-4 bg-ink px-7 py-5 font-serif-sc text-[1.15rem] font-black tracking-[.3em] text-paper no-underline transition-colors hover:bg-seal'
            >
              {t('deadpan.play')}
              <ArrowUpRight
                aria-hidden
                className='size-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1'
              />
            </a>
          </Magnetic>
          <a
            href={CATALOG_URL}
            target='_blank'
            rel='noreferrer'
            className='border-b border-ink pb-1 font-mono text-[.66rem] tracking-[.22em] text-ink uppercase no-underline transition-colors hover:border-seal hover:text-seal'
          >
            {t('dp.catalog.browse')} ↗
          </a>
        </div>
      </div>

      {/* 本刊三事 */}
      <Rule double />
      <p className='py-[1.6vh] font-mono text-[.62rem] tracking-[.26em] uppercase'>{t('dp.film.three')}</p>
      <Rule />
      <div className='grid grid-cols-3'>
        {THREE.map((item, index) => (
          <article
            key={item.tag}
            className='flex min-h-[38vh] flex-col border-r border-ink/55 px-[2vw] py-[4vh] first:pl-0 last:border-r-0 last:pr-0'
          >
            <p className='flex items-baseline justify-between font-mono text-[.62rem] tracking-[.22em] uppercase'>
              <span className='text-seal'>0{index + 1}</span>
              <span>{t(item.tag)}</span>
            </p>
            <h3 className='mt-[5vh] font-serif-sc text-[clamp(1.7rem,3.3vw,3.6rem)] leading-[1.12] font-black'>
              {t(item.title)}
            </h3>
            <p className='mt-auto max-w-[26rem] pt-[4vh] font-serif-sc text-[1.02rem] leading-[1.95]'>{t(item.body)}</p>
          </article>
        ))}
      </div>
      <Rule double />

      {/* 一宗案子怎么走 */}
      <div className='py-[8vh]'>
        <p className='font-mono text-[.62rem] tracking-[.26em] uppercase'>{t('dp.film.loopLabel')}</p>
        <ol className='mt-[3vh] grid grid-cols-5 border-t border-ink'>
          {LOOP.map((key, index) => (
            <li
              key={key}
              className='relative border-r border-ink/40 pt-[2.4vh] pr-[1.4vw] pb-[1vh] pl-[1vw] first:pl-0 last:border-r-0'
            >
              <span className='font-heading text-[clamp(1.6rem,3vw,3rem)] leading-none font-black text-seal italic'>
                {index + 1}
              </span>
              <p className='mt-[1.6vh] font-serif-sc text-[clamp(1rem,1.5vw,1.5rem)] leading-snug font-bold'>
                {t(key)}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {/* 引到卷宗架 */}
      <ChapterHead
        chapter='01'
        name={t('dp.catalog.title')}
        note={
          <>
            <p className='font-mono text-[.62rem] tracking-[.22em] text-seal uppercase'>
              {t('dp.film.stacksCount', { count: CASE_ARCHIVE.length })}
            </p>
            <p>{t('dp.catalog.note')}</p>
          </>
        }
      />
    </PaperSection>
  )
}
