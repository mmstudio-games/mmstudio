import { ArrowUpRight } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Magnetic } from '@/components/motion/magnetic'
import { Redacted } from '@/components/motion/redacted'
import { ScrambleText } from '@/components/motion/scramble-text'
import { SplitFlap } from '@/components/motion/split-flap'
import { Button } from '@/components/ui/button'
import { useInView } from '@/hooks/use-in-view'
import { HGT_URL } from '@/i18n'
import { cn } from '@/lib/utils'
import { usePreferencesStore } from '@/stores/preferences-store'

const ANSWER_KEYS = ['answer1', 'answer2', 'answer3', 'answer4'] as const

/** 翻牌板：示例提问，下方翻牌轮流显示主持人砚仅有的四种回答。 */
function AnswerBoard() {
  const { t } = useTranslation()
  const locale = usePreferencesStore((state) => state.locale)
  const [active, setActive] = useState(0)
  const answers = useMemo(() => ANSWER_KEYS.map((key) => t(`hgt.${key}`)), [t])

  return (
    <div className='relative flex h-full min-h-[460px] flex-col justify-center gap-7 overflow-hidden bg-[#e8e3d6] p-[clamp(1.5rem,4vw,4rem)] lg:min-h-0'>
      <span
        aria-hidden
        className='pointer-events-none absolute -right-[.1em] -bottom-[.28em] font-serif-sc text-[clamp(12rem,24vw,22rem)] leading-none font-bold text-[#1d1b17]/[.04]'
      >
        汤
      </span>
      <div className='flex items-center justify-between font-mono text-[.64rem] tracking-[.2em] text-[#1d1b17]/55 uppercase'>
        <span>{t('hgt.sample')}</span>
        <span>Q.01</span>
      </div>
      <p className='font-serif-sc text-[clamp(1.8rem,3.2vw,3rem)] leading-[1.2] font-medium'>{t('hgt.question')}</p>
      <div className='flex items-center gap-3 font-mono text-[.64rem] tracking-[.2em] text-[#a52a1f] uppercase'>
        <span className='size-1.5 animate-pulse bg-[#a52a1f]' />
        {t('hgt.host')}
      </div>
      <SplitFlap
        words={answers}
        onIndexChange={setActive}
        className={cn(
          'font-serif-sc font-bold',
          locale === 'zh-CN' ? 'text-[clamp(2.2rem,4.6vw,4.4rem)]' : 'font-mono text-[clamp(1.2rem,2.3vw,2.2rem)]',
        )}
      />
      <ul className='flex flex-wrap gap-2'>
        {answers.map((answer, index) => (
          <li
            key={answer}
            className={cn(
              'border px-3 py-1.5 text-[.8rem] transition-colors duration-300',
              index === active
                ? 'border-[#1d1b17] bg-[#1d1b17] text-[#f2efe6]'
                : 'border-[#1d1b17]/20 text-[#1d1b17]/70',
            )}
          >
            {answer}
          </li>
        ))}
      </ul>
      <p className='max-w-[26rem] text-[.82rem] leading-[1.7] text-[#1d1b17]/60'>{t('hgt.answersNote')}</p>
    </div>
  )
}

export function CaseHgt() {
  const { t } = useTranslation()
  const root = useRef<HTMLElement>(null)
  const seen = useInView(root)

  return (
    <article
      ref={root}
      className='grid h-full grid-cols-1 bg-[#f2efe6] text-[#1d1b17] lg:grid-cols-[1fr_1.05fr]'
      aria-labelledby='case-hgt-title'
    >
      <div className='flex flex-col justify-center gap-7 p-[clamp(1.5rem,4vw,4.5rem)]'>
        <ScrambleText
          text={t('hgt.label')}
          className='font-mono text-[.66rem] tracking-[.2em] text-[#1d1b17]/55 uppercase'
        />
        <div>
          <h3
            id='case-hgt-title'
            className='font-serif-sc text-[clamp(3rem,5.6vw,5.6rem)] leading-[.98] font-bold tracking-[-.02em]'
          >
            {t('hgt.name')}
          </h3>
          <p className='mt-3 font-mono text-[.72rem] font-semibold tracking-[.4em] text-[#a52a1f]'>
            {t('hgt.english')}
          </p>
        </div>
        <p className='max-w-[36rem] text-[1rem] leading-[1.85] text-[#1d1b17]/70'>{t('hgt.description')}</p>
        <ul className='border-t border-[#1d1b17]/15'>
          {(['meta1', 'meta2', 'meta3'] as const).map((key, index) => (
            <li
              key={key}
              className='grid grid-cols-[3rem_1fr] border-b border-[#1d1b17]/15 py-3 text-[.85rem] tracking-[.04em]'
            >
              <span className='font-mono text-[#1d1b17]/45'>0{index + 1}</span>
              <span>
                <Redacted revealed={seen} delay={600 + index * 180} barClassName='bg-[#1d1b17]'>
                  {t(`hgt.${key}`)}
                </Redacted>
              </span>
            </li>
          ))}
        </ul>
        <div className='flex flex-wrap items-center gap-3'>
          <Magnetic>
            <Button
              size='lg'
              nativeButton={false}
              className='bg-[#1d1b17] text-[#f2efe6] hover:bg-[#a52a1f]'
              render={<a href={HGT_URL} target='_blank' rel='noreferrer' />}
            >
              {t('hgt.play')} <ArrowUpRight data-icon='inline-end' />
            </Button>
          </Magnetic>
        </div>
        <p className='flex items-center gap-2.5 font-mono text-[.66rem] tracking-[.16em] text-[#1d1b17]/60 uppercase'>
          <span className='size-[7px] bg-[#a52a1f]' />
          {t('hgt.status')}
        </p>
      </div>
      <div className='order-first border-[#1d1b17]/12 lg:order-none lg:border-l'>
        <AnswerBoard />
      </div>
    </article>
  )
}
