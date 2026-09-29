import { gsap } from 'gsap'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Magnetic } from '@/components/motion/magnetic'
import { Redacted } from '@/components/motion/redacted'
import { ScrambleText } from '@/components/motion/scramble-text'
import { Button } from '@/components/ui/button'
import { useInView } from '@/hooks/use-in-view'
import { useFinePointer, useReducedMotion } from '@/hooks/use-media-query'
import { DEADPAN_URL } from '@/i18n'
import { cn } from '@/lib/utils'

/** 卷宗封面：随指针三维倾斜，进入视口时盖下「机密」章。 */
function CaseFileCover({ stamped }: { stamped: boolean }) {
  const { t } = useTranslation()
  const area = useRef<HTMLAnchorElement>(null)
  const file = useRef<HTMLDivElement>(null)
  const fine = useFinePointer()
  const reduced = useReducedMotion()

  useEffect(() => {
    const zone = area.current
    const element = file.current
    if (!zone || !element || !fine || reduced) return
    const rotateX = gsap.quickTo(element, 'rotationX', { duration: 0.8, ease: 'power3' })
    const rotateY = gsap.quickTo(element, 'rotationY', { duration: 0.8, ease: 'power3' })
    const move = (event: PointerEvent) => {
      const rect = zone.getBoundingClientRect()
      rotateY(((event.clientX - rect.left) / rect.width - 0.5) * 18)
      rotateX(-((event.clientY - rect.top) / rect.height - 0.5) * 12)
    }
    const leave = () => {
      rotateX(0)
      rotateY(0)
    }
    zone.addEventListener('pointermove', move)
    zone.addEventListener('pointerleave', leave)
    return () => {
      zone.removeEventListener('pointermove', move)
      zone.removeEventListener('pointerleave', leave)
    }
  }, [fine, reduced])

  return (
    <Link
      ref={area}
      to='/games/deadpan'
      tabIndex={-1}
      aria-hidden
      data-cursor={t('cases.open')}
      className='group/file relative grid min-h-[440px] place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_30%,#5e4c34,transparent_60%),repeating-linear-gradient(110deg,rgba(255,255,255,.025)_0_1px,transparent_1px_7px)] [perspective:1400px] lg:min-h-0'
    >
      <div className='absolute aspect-[.72] w-[min(58%,360px)] translate-x-3 translate-y-2 rotate-[5deg] border border-[#7c6545]/60 bg-[#cbb792] shadow-[0_20px_50px_rgba(0,0,0,.4)] transition-transform duration-700 ease-out-expo group-hover/file:translate-x-10 group-hover/file:rotate-[9deg]' />
      <div className='absolute aspect-[.72] w-[min(58%,360px)] -translate-x-2 rotate-[-4deg] border border-[#7c6545]/60 bg-[#dccaa6] shadow-[0_20px_50px_rgba(0,0,0,.35)] transition-transform duration-700 ease-out-expo group-hover/file:-translate-x-8 group-hover/file:rotate-[-8deg]' />
      <div
        ref={file}
        className="relative aspect-[.72] w-[min(58%,360px)] border border-[#7c6545] bg-[linear-gradient(135deg,#f5efdf,#e4d5b8)] p-6 text-[#261e16] shadow-[18px_26px_60px_rgba(0,0,0,.45)] [transform-style:preserve-3d] after:pointer-events-none after:absolute after:inset-0 after:bg-[repeating-linear-gradient(0deg,transparent_0_5px,rgba(55,40,24,.05)_6px)] after:opacity-30 after:content-['']"
      >
        <div className='flex justify-between border-b-2 border-current pb-3 font-mono text-[.58rem] leading-none font-bold tracking-[.12em]'>
          <span>CASE FILE</span>
          <span>001—2026</span>
        </div>
        <div
          className={cn(
            'absolute top-20 right-6 border-2 border-[#8f2f21] p-2 text-center font-serif-sc leading-[1.1] font-bold text-[#8f2f21] transition-[scale,rotate,opacity] duration-500 ease-[cubic-bezier(.2,1.5,.4,1)]',
            stamped ? 'scale-100 rotate-[8deg] opacity-90' : 'scale-[2.4] rotate-[-14deg] opacity-0',
          )}
          style={{ transitionDelay: stamped ? '450ms' : '0ms' }}
        >
          机<br />密
        </div>
        <p className='mt-24 font-serif-sc text-[clamp(2.6rem,4.4vw,4.2rem)] leading-none font-bold tracking-[.12em] [writing-mode:vertical-rl] min-[601px]:mt-28'>
          积案拂尘
        </p>
        <p className='absolute right-6 bottom-16 origin-bottom-right rotate-90 font-heading text-[1.6rem] tracking-[.08em]'>
          DEADPAN
        </p>
        <div className='absolute bottom-6 left-6 font-mono text-[.6rem] leading-[1.2] font-bold tracking-[.14em] text-[#8f2f21]'>
          ACTIVE
          <br />
          ARCHIVE
        </div>
      </div>
    </Link>
  )
}

export function CaseDeadpan() {
  const { t } = useTranslation()
  const root = useRef<HTMLElement>(null)
  const seen = useInView(root)

  return (
    <article
      ref={root}
      className='grid h-full grid-cols-1 bg-[#1f1710] text-[#ebe0c8] lg:grid-cols-[1.05fr_1fr]'
      aria-labelledby='case-deadpan-title'
    >
      <CaseFileCover stamped={seen} />
      <div className='flex flex-col justify-center gap-7 border-[#ebe0c8]/12 p-[clamp(1.5rem,4vw,4.5rem)] lg:border-l'>
        <ScrambleText
          text={t('deadpan.label')}
          className='font-mono text-[.66rem] tracking-[.2em] text-[#ebe0c8]/60 uppercase'
        />
        <div>
          <h3
            id='case-deadpan-title'
            className='font-serif-sc text-[clamp(3.2rem,6.4vw,6.4rem)] leading-[.95] font-bold tracking-[-.02em]'
          >
            {t('deadpan.name')}
          </h3>
          <p className='mt-3 font-mono text-[.72rem] font-semibold tracking-[.4em]'>{t('deadpan.english')}</p>
        </div>
        <p className='max-w-[36rem] text-[1rem] leading-[1.85] text-[#ebe0c8]/70'>{t('deadpan.description')}</p>
        <ul className='border-t border-[#ebe0c8]/15'>
          {(['meta1', 'meta2', 'meta3'] as const).map((key, index) => (
            <li
              key={key}
              className='grid grid-cols-[3rem_1fr] border-b border-[#ebe0c8]/15 py-3 text-[.85rem] tracking-[.04em]'
            >
              <span className='font-mono text-[#ebe0c8]/45'>0{index + 1}</span>
              <span>
                <Redacted revealed={seen} delay={600 + index * 180} barClassName='bg-[#ebe0c8]'>
                  {t(`deadpan.${key}`)}
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
              className='bg-[#ebe0c8] text-[#1f1710] hover:bg-accent hover:text-accent-foreground'
              render={<a href={DEADPAN_URL} target='_blank' rel='noreferrer' />}
            >
              {t('deadpan.play')} <ArrowUpRight data-icon='inline-end' />
            </Button>
          </Magnetic>
          <Magnetic strength={0.2}>
            <Button
              size='lg'
              variant='outline'
              nativeButton={false}
              className='border-[#ebe0c8]/30 hover:bg-[#ebe0c8]/10'
              render={<Link to='/games/deadpan' />}
            >
              {t('deadpan.details')} <ArrowRight data-icon='inline-end' />
            </Button>
          </Magnetic>
        </div>
        <p className='flex items-center gap-2.5 font-mono text-[.66rem] tracking-[.16em] text-[#ebe0c8]/60 uppercase'>
          <span className='size-[7px] animate-pulse bg-accent' />
          {t('deadpan.status')}
        </p>
      </div>
    </article>
  )
}
