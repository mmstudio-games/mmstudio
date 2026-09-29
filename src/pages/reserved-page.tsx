import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Magnetic } from '@/components/motion/magnetic'
import { Redacted } from '@/components/motion/redacted'
import { ScrambleText } from '@/components/motion/scramble-text'
import { Button } from '@/components/ui/button'

/** 预留页：标题先被机密条盖住，随后揭开；背景是巨大的空心 RESERVED。路由里按 page 设置 key，换页时重新播放。 */
export function ReservedPage({ page }: { page: 'news' | 'about' | 'contact' }) {
  const { t } = useTranslation()
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setRevealed(true), 900)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <section className='relative flex min-h-[calc(100svh-72px)] flex-col justify-center overflow-hidden px-[clamp(1.25rem,4vw,4.5rem)] py-24'>
      <span
        aria-hidden
        className='pointer-events-none absolute -bottom-[.12em] left-0 font-heading text-[22vw] leading-none tracking-[-.04em] whitespace-nowrap text-transparent select-none [-webkit-text-stroke:1px_var(--border)]'
      >
        RESERVED
      </span>
      <p className='relative flex items-center gap-4 font-mono text-[.66rem] tracking-[.2em] text-muted-foreground uppercase'>
        <span className='size-1.5 animate-pulse bg-accent' />
        <ScrambleText text={`FILE / ${page.toUpperCase()} — ${t('reserved.label')}`} />
      </p>
      <h1 className='relative my-10 mb-16 max-w-[14em] font-heading text-[clamp(3rem,7.5vw,7.5rem)] leading-[1.02] font-medium tracking-[-.04em]'>
        <Redacted revealed={revealed} barClassName='bg-foreground'>
          {t(`reserved.${page}`)}
        </Redacted>
      </h1>
      <Magnetic className='relative w-fit'>
        <Button variant='outline' size='lg' nativeButton={false} render={<Link to='/' />}>
          <ArrowLeft data-icon='inline-start' />
          {t('reserved.back')}
        </Button>
      </Magnetic>
    </section>
  )
}
