import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Magnetic } from '@/components/motion/magnetic'
import { RollText } from '@/components/motion/roll-text'
import { DEADPAN_URL } from '@/i18n'
import { usePreferencesStore } from '@/stores/preferences-store'

import { CATALOG_URL } from './case-archive'

/** 收尾：一句取自游戏站的话，和一个巨大的「开卷」入口。 */
export function DeadpanFinale() {
  const { t } = useTranslation()
  const zh = usePreferencesStore((state) => state.locale) === 'zh-CN'

  return (
    <section
      aria-labelledby='dp-finale-title'
      className='relative flex min-h-[80svh] flex-col items-center justify-center gap-10 overflow-hidden px-[clamp(1.25rem,4vw,4.5rem)] py-24 text-center'
    >
      <p
        id='dp-finale-title'
        className='font-serif-sc text-[clamp(1.4rem,3vw,2.4rem)] leading-[1.4] text-muted-foreground'
      >
        {t('dp.finale.line')}
      </p>
      <Magnetic strength={0.15}>
        <a
          href={DEADPAN_URL}
          target='_blank'
          rel='noreferrer'
          data-cursor={t('deadpan.play')}
          className='group/roll relative flex items-center gap-[.1em] leading-none no-underline'
        >
          <RollText
            text={t('dp.finale.cta')}
            className={
              zh
                ? 'font-serif-sc text-[clamp(6rem,22vw,20rem)] font-black tracking-[.08em] transition-colors duration-500 group-hover/roll:text-accent'
                : 'font-heading text-[clamp(4rem,13vw,12rem)] font-semibold tracking-[-.03em] transition-colors duration-500 group-hover/roll:text-accent'
            }
          />
          <ArrowUpRight
            aria-hidden
            className='size-[clamp(3rem,9vw,8rem)] stroke-1 transition-transform duration-700 ease-out-expo group-hover/roll:translate-x-2 group-hover/roll:-translate-y-2'
          />
          <span className='sr-only'>{t('a11y.external')}</span>
        </a>
      </Magnetic>
      <a
        href={CATALOG_URL}
        target='_blank'
        rel='noreferrer'
        className='group/roll flex items-center gap-2 font-mono text-[.7rem] tracking-[.2em] text-muted-foreground uppercase no-underline hover:text-foreground'
      >
        <RollText text={t('dp.catalog.browse')} />
        <ArrowUpRight aria-hidden className='size-3.5' />
      </a>
    </section>
  )
}
