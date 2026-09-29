import { ArrowUpRight, GitBranch } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router-dom'

import { RollText } from '@/components/motion/roll-text'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { GITHUB_URL, HGT_URL } from '@/i18n'
import { cn } from '@/lib/utils'
import { usePreferencesStore } from '@/stores/preferences-store'

export const NAV_ITEMS = [
  { to: '/', label: 'nav.home' },
  { to: '/games/deadpan', label: 'nav.deadpan' },
  { href: HGT_URL, label: 'nav.hgt' },
  { to: '/news', label: 'nav.news' },
] as const

export function Wordmark() {
  const { t } = useTranslation()
  return (
    <Link
      to='/'
      className='group/roll flex w-fit items-baseline font-heading leading-none text-inherit no-underline'
      aria-label={t('a11y.home')}
    >
      <RollText text='MM' className='text-[1.65rem] font-semibold tracking-[-.1em]' />
      <span className='ml-[.45rem] font-sans text-[.58rem] font-bold tracking-[.22em]'>STUDIO</span>
    </Link>
  )
}

export function SiteHeader() {
  const { t } = useTranslation()
  const locale = usePreferencesStore((state) => state.locale)
  const setLocale = usePreferencesStore((state) => state.setLocale)
  const progress = useRef<HTMLDivElement>(null)
  const [hidden, setHidden] = useState(false)
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    let last = window.scrollY
    const update = () => {
      const y = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (progress.current) progress.current.style.transform = `scaleX(${max > 0 ? y / max : 0})`
      setSolid(y > 24)
      if (y < 160) setHidden(false)
      else if (y > last + 6) setHidden(true)
      else if (y < last - 6) setHidden(false)
      last = y
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  const toggleLocale = () => setLocale(locale === 'zh-CN' ? 'en' : 'zh-CN')

  return (
    <header
      className={cn(
        'sticky top-0 z-50 grid h-[72px] grid-cols-[1fr_auto] items-center border-b px-[clamp(1.25rem,4vw,4.5rem)] transition-[translate,background-color,border-color] duration-700 ease-out-expo md:grid-cols-[1fr_auto_1fr]',
        hidden && '-translate-y-full',
        solid ? 'border-border bg-background/80 backdrop-blur-md' : 'border-transparent bg-transparent',
      )}
    >
      <div
        ref={progress}
        aria-hidden
        className='absolute inset-x-0 bottom-[-1px] h-px origin-left scale-x-0 bg-accent'
      />
      <Wordmark />
      <nav className='hidden items-center gap-9 md:flex' aria-label={t('a11y.primaryNavigation')}>
        {NAV_ITEMS.map((item) =>
          'href' in item ? (
            <a
              key={item.label}
              href={item.href}
              target='_blank'
              rel='noreferrer'
              className='group/roll flex items-center gap-1 text-[.7rem] font-bold tracking-[.16em] text-muted-foreground uppercase no-underline transition-colors hover:text-foreground'
            >
              <RollText text={t(item.label)} />
              <ArrowUpRight className='size-3' aria-hidden />
              <span className='sr-only'>{t('a11y.external')}</span>
            </a>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  'group/roll relative flex items-center gap-2 text-[.7rem] font-bold tracking-[.16em] text-muted-foreground uppercase no-underline transition-colors hover:text-foreground',
                  isActive && 'text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden
                    className={cn(
                      'size-[5px] bg-accent transition-transform duration-500 ease-out-expo',
                      isActive ? 'scale-100' : 'scale-0',
                    )}
                  />
                  <RollText text={t(item.label)} />
                </>
              )}
            </NavLink>
          ),
        )}
      </nav>
      <div className='flex items-center justify-self-end gap-1'>
        <Button
          variant='ghost'
          size='sm'
          onClick={toggleLocale}
          aria-label={t('a11y.switchLanguage')}
          className='group/roll'
        >
          <RollText text={locale === 'zh-CN' ? 'EN' : '中文'} />
        </Button>
        <Button
          variant='ghost'
          size='icon-sm'
          nativeButton={false}
          render={<a href={GITHUB_URL} target='_blank' rel='noreferrer' aria-label={t('a11y.github')} />}
        >
          <GitBranch />
        </Button>
        <MobileMenu />
      </div>
    </header>
  )
}

function MobileMenu() {
  const { t } = useTranslation()

  return (
    <Sheet>
      <SheetTrigger
        className='md:hidden'
        render={
          <Button variant='ghost' size='sm' aria-label={t('a11y.openNavigation')} className='gap-2'>
            {t('nav.menu')}
            <span aria-hidden className='flex w-4 flex-col gap-[3px]'>
              <span className='h-px bg-current' />
              <span className='h-px w-2/3 bg-current' />
            </span>
          </Button>
        }
      />
      <SheetContent
        side='right'
        closeLabel={t('a11y.closeNavigation')}
        className='w-full border-l-0 bg-background p-[clamp(1.25rem,6vw,3rem)] data-[side=right]:w-full data-[side=right]:sm:max-w-none'
      >
        <SheetTitle className='font-mono text-[.7rem] tracking-[.2em] text-muted-foreground'>
          MMSTUDIO / INDEX
        </SheetTitle>
        <nav className='mt-20 flex flex-col' aria-label={t('a11y.primaryNavigation')}>
          {NAV_ITEMS.map((item, index) => {
            const content = (
              <>
                <span className='font-mono text-[.7rem] text-accent'>0{index + 1}</span>
                <span className='font-heading text-[clamp(2.4rem,11vw,4rem)] leading-[1.05]'>{t(item.label)}</span>
                {'href' in item ? <ArrowUpRight className='size-6 self-center' aria-hidden /> : null}
              </>
            )
            const className =
              'flex items-baseline gap-5 border-b border-border py-5 no-underline animate-in fade-in slide-in-from-bottom-6 fill-mode-both duration-700'
            const style = { animationDelay: `${120 + index * 70}ms` }
            return (
              <SheetClose
                key={item.label}
                render={
                  'href' in item ? (
                    // biome-ignore lint/a11y/useAnchorContent: 内容由 SheetClose 的 children 传入
                    <a href={item.href} target='_blank' rel='noreferrer' className={className} style={style} />
                  ) : (
                    <Link to={item.to} className={className} style={style} />
                  )
                }
              >
                {content}
              </SheetClose>
            )
          })}
        </nav>
        <p className='mt-auto font-mono text-[.62rem] tracking-[.18em] text-muted-foreground uppercase'>
          {t('hero.statement')}
        </p>
      </SheetContent>
    </Sheet>
  )
}
