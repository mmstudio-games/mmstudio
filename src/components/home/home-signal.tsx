import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Magnetic } from '@/components/motion/magnetic'
import { Marquee } from '@/components/motion/marquee'
import { ScrambleText } from '@/components/motion/scramble-text'
import { SectionLabel } from '@/components/site/section-label'
import { GITHUB_URL } from '@/i18n'

/** 最新讯号：随滚动速度加速、倾斜的跑马灯，之后是讯号正文。 */
export function HomeSignal() {
  const { t } = useTranslation()

  return (
    <section aria-labelledby='signal-title' className='pb-[clamp(6rem,10vw,9rem)]'>
      <Marquee className='border-y border-border py-6' speed={60}>
        <span aria-hidden className='flex items-center gap-[4vw] pr-[4vw] whitespace-nowrap'>
          <span className='font-heading text-[clamp(4rem,10vw,9.5rem)] leading-[1.05] tracking-[-.02em] text-transparent [-webkit-text-stroke:1px_var(--foreground)]'>
            {t('signal.title')}
          </span>
          <span className='size-[clamp(.8rem,1.4vw,1.3rem)] bg-accent' />
          <span className='font-mono text-[.8rem] tracking-[.3em] text-muted-foreground uppercase'>
            {t('signal.label')} · {t('signal.date')}
          </span>
          <span className='size-[clamp(.8rem,1.4vw,1.3rem)] bg-accent' />
        </span>
      </Marquee>

      <div className='grid gap-14 px-[clamp(1.25rem,4vw,4.5rem)] pt-[clamp(4rem,8vw,7rem)] lg:grid-cols-[.8fr_1.2fr]'>
        <div className='flex flex-col gap-10'>
          <SectionLabel index='04' label={t('signal.label')} />
          <p className='font-heading text-[clamp(4rem,9vw,8.5rem)] leading-[.85] font-medium tracking-[-.04em] tabular-nums'>
            <ScrambleText text={t('signal.date')} duration={1.1} />
          </p>
        </div>
        <div className='flex flex-col justify-end gap-8 lg:pl-[6vw]'>
          <h2
            id='signal-title'
            className='font-heading text-[clamp(2.6rem,5vw,5rem)] leading-[1.02] font-medium tracking-[-.03em] text-balance'
          >
            {t('signal.title')}
          </h2>
          <p className='max-w-[38rem] leading-[1.85] text-muted-foreground'>{t('signal.body')}</p>
          <Magnetic className='w-fit'>
            <a
              href={GITHUB_URL}
              target='_blank'
              rel='noreferrer'
              className='group flex w-fit items-center gap-3 border-b border-current pb-2 text-[.75rem] font-bold tracking-[.16em] uppercase no-underline transition-colors hover:text-accent'
            >
              {t('signal.action')}
              <ArrowUpRight className='size-4 transition-transform duration-500 ease-out-expo group-hover:translate-x-1 group-hover:-translate-y-1' />
            </a>
          </Magnetic>
        </div>
      </div>
    </section>
  )
}
