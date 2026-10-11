import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { useInView } from '@/hooks/use-in-view'
import { cn } from '@/lib/utils'

import { Rule, Seal } from './paper-kit'
import { ChapterHead, PaperSection } from './paper-section'

const PARTS = ['part1', 'part2', 'part3', 'part4', 'part5', 'part6'] as const

/** 04 见报：一篇独家报道的版式。六节的名称取自游戏站报道页，最后盖「已刊」章。 */
export function PaperPress() {
  const { t, i18n } = useTranslation()
  const zh = i18n.language.startsWith('zh')
  const stampArea = useRef<HTMLDivElement>(null)
  const stamped = useInView(stampArea, '0px 0px -35% 0px')
  const date = new Date().toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <PaperSection id='press' label={`04 ${t('dp.chapters.publish')}`} className='pt-[10vh] pb-[18vh]'>
      <ChapterHead chapter='04' name={t('dp.chapters.publish')} note={<p>{t('dp.film.pressNote')}</p>} />

      <div className='grid grid-cols-12 gap-x-[2.4vw] pt-[7vh]'>
        <div className='col-span-9'>
          <p className='font-mono text-[.62rem] tracking-[.26em] text-seal uppercase'>{t('dp.paper.kicker')}</p>
          <h3 className='mt-[2vh] font-serif-sc text-[clamp(2.2rem,5.6vw,6rem)] leading-[1.04] font-black tracking-[-.01em]'>
            {t('signal.title')}
          </h3>
          <p className='mt-[3vh] flex gap-6 border-y border-ink/55 py-[1.2vh] font-mono text-[.62rem] tracking-[.22em] uppercase'>
            <span>{t('dp.paper.masthead')}</span>
            <span>{date}</span>
            <span>{t('dp.hero.office')}</span>
          </p>
        </div>

        <div ref={stampArea} className='relative col-span-3 flex items-start justify-end pt-[2vh]'>
          <Seal
            className={cn(
              'text-[clamp(2rem,4.2vw,4.6rem)] transition-[opacity,scale] duration-500 ease-out-expo',
              stamped ? 'scale-100 opacity-100' : 'scale-[1.9] opacity-0',
            )}
          >
            {t('dp.paper.stamp')}
          </Seal>
        </div>
      </div>

      {/* 一份报道的六节 */}
      <div className='mt-[8vh]'>
        <Rule double />
        <p className='py-[1.6vh] font-mono text-[.62rem] tracking-[.26em] uppercase'>{t('dp.paper.parts')}</p>
        <Rule />
        <ol className='grid grid-cols-6'>
          {PARTS.map((part, index) => (
            <li
              key={part}
              className='flex min-h-[26vh] flex-col justify-between border-r border-ink/55 px-[1.2vw] py-[3vh] first:pl-0 last:border-r-0'
            >
              <span className='font-heading text-[clamp(1.4rem,2.4vw,2.6rem)] leading-none font-black text-seal italic'>
                {index + 1}
              </span>
              <span
                className={cn(
                  'font-serif-sc leading-tight font-black [overflow-wrap:anywhere]',
                  zh ? 'text-[clamp(1.4rem,2.6vw,2.9rem)]' : 'text-[clamp(1rem,1.5vw,1.7rem)]',
                )}
              >
                {t(`dp.paper.${part}`)}
              </span>
            </li>
          ))}
        </ol>
        <Rule double />
      </div>

      {/* 真相回到人身上 */}
      <blockquote className='mx-auto mt-[12vh] max-w-[62rem] text-center'>
        <p className='font-serif-sc text-[clamp(2.2rem,5.6vw,6rem)] leading-[1.1] font-black'>
          “{t('pillars.threeTitle')}”
        </p>
        <p className='mx-auto mt-[4vh] max-w-[34rem] font-serif-sc text-[1.08rem] leading-[1.95]'>
          {t('pillars.threeBody')}
        </p>
      </blockquote>
    </PaperSection>
  )
}
