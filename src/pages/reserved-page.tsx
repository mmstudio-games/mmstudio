import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function ReservedPage({ page }: { page: 'deadpan' | 'news' | 'about' | 'contact' }) {
  const { t } = useTranslation()
  return (
    <section className='min-h-[calc(100svh-72px)] px-[clamp(1.25rem,6vw,7rem)] pt-[15vh]'>
      <p className='text-[.67rem] leading-normal font-bold tracking-[.2em] uppercase'>
        RESERVED / {page.toUpperCase()}
      </p>
      <h1 className='my-8 mb-16 max-w-[900px] font-heading text-[clamp(3.5rem,8vw,8rem)] leading-[.95] font-medium tracking-[-.05em]'>
        {t(`reserved.${page}`)}
      </h1>
      <Button variant='outline' nativeButton={false} render={<Link to='/' />}>
        <ArrowLeft data-icon='inline-start' />
        {t('reserved.back')}
      </Button>
    </section>
  )
}
