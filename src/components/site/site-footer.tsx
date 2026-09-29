import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUp, ArrowUpRight } from 'lucide-react'
import { type ReactNode, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Magnetic } from '@/components/motion/magnetic'
import { RollText } from '@/components/motion/roll-text'
import { useFinePointer, useReducedMotion } from '@/hooks/use-media-query'
import { DEADPAN_URL, GITHUB_URL, HGT_URL } from '@/i18n'
import { scrollToTop } from '@/lib/smooth-scroll'
import { usePreferencesStore } from '@/stores/preferences-store'

const WORDMARK = Array.from('MMSTUDIO')

function FooterLink({ children, href, to }: { children: string; href?: string; to?: string }) {
  const { t } = useTranslation()
  const className =
    'group/roll flex w-fit items-center gap-1.5 py-1 text-[.95rem] text-foreground/80 no-underline transition-colors hover:text-foreground'
  if (to)
    return (
      <Link to={to} className={className}>
        <RollText text={children} />
      </Link>
    )
  return (
    <a href={href} target='_blank' rel='noreferrer' className={className}>
      <RollText text={children} />
      <ArrowUpRight aria-hidden className='size-3.5 opacity-60' />
      <span className='sr-only'>{t('a11y.external')}</span>
    </a>
  )
}

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className='flex flex-col gap-1'>
      <p className='mb-3 font-mono text-[.64rem] tracking-[.2em] text-muted-foreground uppercase'>{title}</p>
      {children}
    </div>
  )
}

/** 巨型字标：字母随页脚露出而升起；指针靠近的字母变粗。 */
function GiantWordmark() {
  const root = useRef<HTMLDivElement>(null)
  const fine = useFinePointer()
  const reduced = useReducedMotion()

  useEffect(() => {
    const element = root.current
    if (!element || !fine || reduced) return
    const letters = [...element.querySelectorAll<HTMLElement>('[data-letter]')]
    const weights = letters.map(() => 420)
    const targets = letters.map(() => 420)
    let frame = 0

    const render = () => {
      let moving = false
      letters.forEach((letter, index) => {
        weights[index] += (targets[index] - weights[index]) * 0.14
        if (Math.abs(targets[index] - weights[index]) > 0.5) moving = true
        letter.style.fontWeight = String(Math.round(weights[index]))
      })
      frame = moving ? requestAnimationFrame(render) : 0
    }
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(render)
    }
    const move = (event: PointerEvent) => {
      letters.forEach((letter, index) => {
        const rect = letter.getBoundingClientRect()
        const distance = Math.abs(event.clientX - (rect.left + rect.width / 2))
        targets[index] = 420 + 480 * Math.max(0, 1 - distance / (window.innerWidth * 0.22))
      })
      kick()
    }
    const leave = () => {
      targets.fill(420)
      kick()
    }
    element.addEventListener('pointermove', move)
    element.addEventListener('pointerleave', leave)
    return () => {
      cancelAnimationFrame(frame)
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerleave', leave)
    }
  }, [fine, reduced])

  return (
    <div
      ref={root}
      aria-hidden
      className='flex justify-between overflow-hidden pt-[2vw] font-heading text-[16.4vw] leading-[.86] tracking-[-.02em] select-none'
    >
      {WORDMARK.map((letter, index) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: 字标字母固定
          key={index}
          data-letter
          className='inline-block font-[420] will-change-transform'
        >
          {letter}
        </span>
      ))}
    </div>
  )
}

export function SiteFooter() {
  const { t } = useTranslation()
  const root = useRef<HTMLElement>(null)
  const locale = usePreferencesStore((state) => state.locale)
  const setLocale = usePreferencesStore((state) => state.setLocale)

  useGSAP(
    () => {
      const footer = root.current
      const main = document.getElementById('main-content')
      if (!footer || !main) return
      const media = gsap.matchMedia()
      media.add('(prefers-reduced-motion: no-preference)', () => {
        const trigger = {
          trigger: main,
          start: 'bottom bottom',
          end: () => `+=${footer.offsetHeight}`,
          scrub: true,
          invalidateOnRefresh: true,
        }
        gsap.fromTo('[data-footer-inner]', { yPercent: -28 }, { yPercent: 0, ease: 'none', scrollTrigger: trigger })
        // 字标在页脚露出的后半程升起，正好在滚到底时落定。
        gsap.fromTo(
          '[data-letter]',
          { yPercent: 100 },
          {
            yPercent: 0,
            ease: 'power2.out',
            stagger: 0.04,
            scrollTrigger: {
              ...trigger,
              start: () => ScrollTrigger.maxScroll(window) - footer.offsetHeight * 0.6,
              end: () => ScrollTrigger.maxScroll(window),
            },
          },
        )
      })
      return () => media.revert()
    },
    { scope: root },
  )

  return (
    <footer ref={root} className='sticky bottom-0 z-0 overflow-hidden bg-[oklch(0.12_0.008_60)]'>
      <div
        data-footer-inner
        className='flex flex-col px-[clamp(1.25rem,4vw,4.5rem)] pt-[clamp(4rem,9vw,8rem)] pb-[clamp(1.25rem,4vw,4.5rem)]'
      >
        <div className='grid gap-14 lg:grid-cols-[1.2fr_1fr]'>
          <p className='max-w-[14ch] font-heading text-[clamp(2.2rem,5vw,4.6rem)] leading-[1] tracking-[-.03em]'>
            {t('hero.words')} <em className='text-accent'>{t('hero.choices')}</em>
          </p>
          <div className='grid grid-cols-2 gap-10 sm:grid-cols-3'>
            <Column title={t('footer.games')}>
              <FooterLink href={DEADPAN_URL}>{t('nav.deadpan')}</FooterLink>
              <FooterLink href={HGT_URL}>{t('nav.hgt')}</FooterLink>
            </Column>
            <Column title={t('footer.site')}>
              <FooterLink to='/'>{t('nav.home')}</FooterLink>
              <FooterLink to='/games/deadpan'>{t('deadpan.details')}</FooterLink>
              <FooterLink to='/news'>{t('nav.news')}</FooterLink>
            </Column>
            <Column title={t('footer.elsewhere')}>
              <FooterLink href={GITHUB_URL}>{t('nav.github')}</FooterLink>
              <p className='mt-6 mb-2 font-mono text-[.64rem] tracking-[.2em] text-muted-foreground uppercase'>
                {t('footer.language')}
              </p>
              <div className='flex gap-3 text-[.8rem] font-semibold'>
                {(['zh-CN', 'en'] as const).map((value) => (
                  <button
                    key={value}
                    type='button'
                    onClick={() => setLocale(value)}
                    aria-pressed={locale === value}
                    className='border-b border-transparent pb-0.5 text-muted-foreground transition-colors hover:text-foreground aria-pressed:border-accent aria-pressed:text-foreground'
                  >
                    {value === 'zh-CN' ? '中文' : 'English'}
                  </button>
                ))}
              </div>
            </Column>
          </div>
        </div>

        <div className='mt-20 flex items-end justify-between gap-6 border-t border-border pt-6 font-mono text-[.62rem] tracking-[.16em] text-muted-foreground uppercase'>
          <span>© 2026 · {t('footer.rights')}</span>
          <Magnetic>
            <button
              type='button'
              onClick={() => scrollToTop()}
              className='flex items-center gap-2 border border-border px-4 py-3 text-foreground transition-colors hover:border-accent hover:bg-accent'
            >
              {t('a11y.backToTop')} <ArrowUp aria-hidden className='size-3.5' />
            </button>
          </Magnetic>
        </div>
        <GiantWordmark />
      </div>
    </footer>
  )
}
