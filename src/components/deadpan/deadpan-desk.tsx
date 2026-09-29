import { gsap } from 'gsap'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import crumpledPaper from '@/assets/textures/crumpled-paper.webp'
import deskLeather from '@/assets/textures/desk-leather.webp'
import finePaper from '@/assets/textures/fine-paper.webp'
import folderCardboard from '@/assets/textures/folder-cardboard.webp'
import kraftPaper from '@/assets/textures/kraft-paper.webp'
import { TypedText } from '@/components/motion/typed-text'
import { useFinePointer, useReducedMotion } from '@/hooks/use-media-query'
import { DEADPAN_URL } from '@/i18n'
import { cn } from '@/lib/utils'
import { usePreferencesStore } from '@/stores/preferences-store'

import { CASE_ARCHIVE } from './case-archive'
import { travel } from './desk-travel'

/** 桌子外框：深胡桃木。台垫（皮革）画在桌面组件里。 */
export const DESK_STYLE: CSSProperties = {
  backgroundColor: '#1d140d',
  backgroundImage: [
    'repeating-linear-gradient(91deg, rgba(0,0,0,.18) 0 1px, transparent 1px 7px, rgba(255,220,170,.03) 7px 8px, transparent 8px 15px)',
    'linear-gradient(180deg, #2a1d13, #160f09)',
  ].join(','),
}

const INK = '#17120d'
const RED = '#842219'
const PEN = '#b8321f'
const LAMP = { x: 0.22, y: 0.06 }

const TEXTURES = {
  cardboard: { src: folderCardboard, size: '460px' },
  kraft: { src: kraftPaper, size: '260px' },
  crumpled: { src: crumpledPaper, size: '520px' },
  fine: { src: finePaper, size: '420px' },
} as const

/** 两层阴影：贴桌面的接触影 + 柔和环境影；方向来自台灯（--sx/--sy），抬起量来自 --lift。 */
const SHADOW =
  'drop-shadow(calc(var(--sx, 3) * .16px) calc(var(--sy, 5) * .16px) 1px rgba(20,10,4,.62)) drop-shadow(calc(var(--sx, 3) * (1px + var(--lift) * 1.4px)) calc(var(--sy, 5) * (1px + var(--lift) * 1.4px)) calc(7px + var(--lift) * 18px) rgba(20,10,4,.42))'

/** 折角：裁掉一个角的三角形。 */
const cutBottomRight = (size: string) =>
  `polygon(0 0, 100% 0, 100% calc(100% - ${size}), calc(100% - ${size}) 100%, 0 100%)`
const cutTopRight = (size: string) => `polygon(0 0, calc(100% - ${size}) 0, 100% ${size}, 100% 100%, 0 100%)`

/** 撕边：确定性伪随机的锯齿多边形。 */
function tornEdge(seed: number, amplitude = 1.4) {
  let state = seed
  const random = () => {
    state = (state * 16807) % 2147483647
    return state / 2147483647
  }
  const steps = 26
  const points: string[] = []
  for (let i = 0; i <= steps; i++) points.push(`${(i / steps) * 100}% ${random() * amplitude}%`)
  for (let i = 1; i <= steps; i++) points.push(`${100 - random() * amplitude * 0.5}% ${(i / steps) * 100}%`)
  for (let i = steps - 1; i >= 0; i--) points.push(`${(i / steps) * 100}% ${100 - random() * amplitude}%`)
  for (let i = steps - 1; i >= 1; i--) points.push(`${random() * amplitude * 0.5}% ${(i / steps) * 100}%`)
  return `polygon(${points.join(',')})`
}
const CLIPPING_EDGE = tornEdge(7)
const TAG_SHAPE = 'polygon(20% 0, 80% 0, 100% 11%, 100% 100%, 0 100%, 0 11%)'
const RINGS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']

/** 共用的 SVG 滤镜与渐变：纸张毛边、印章缺墨、印刷油墨不均、金属。 */
function DeskDefs() {
  return (
    <svg aria-hidden='true' width='0' height='0' className='absolute'>
      <defs>
        <filter id='dp-rough' x='-4%' y='-4%' width='108%' height='108%'>
          <feTurbulence type='fractalNoise' baseFrequency='0.045' numOctaves='3' seed='3' result='noise' />
          <feDisplacementMap in='SourceGraphic' in2='noise' scale='4' xChannelSelector='R' yChannelSelector='G' />
        </filter>
        <filter id='dp-ink' x='-10%' y='-10%' width='120%' height='120%'>
          <feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2' seed='8' result='grain' />
          <feColorMatrix
            in='grain'
            type='matrix'
            values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -4 0 0 0 3.1'
            result='holes'
          />
          <feComposite in='SourceGraphic' in2='holes' operator='in' result='inked' />
          <feTurbulence type='fractalNoise' baseFrequency='0.05' numOctaves='2' seed='2' result='warp' />
          <feDisplacementMap in='inked' in2='warp' scale='2.4' xChannelSelector='R' yChannelSelector='G' />
        </filter>
        <filter id='dp-type' x='-2%' y='-2%' width='104%' height='104%'>
          <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' seed='5' result='jitter' />
          <feDisplacementMap in='SourceGraphic' in2='jitter' scale='1.1' xChannelSelector='R' yChannelSelector='G' />
        </filter>
        <linearGradient id='dp-steel' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0' stopColor='#eef1f4' />
          <stop offset='.45' stopColor='#9ba3ab' />
          <stop offset='.7' stopColor='#d9dde1' />
          <stop offset='1' stopColor='#6c737a' />
        </linearGradient>
        <radialGradient id='dp-brass' cx='.35' cy='.3' r='.8'>
          <stop offset='0' stopColor='#f6e3b0' />
          <stop offset='.45' stopColor='#b8914c' />
          <stop offset='1' stopColor='#5e4520' />
        </radialGradient>
      </defs>
    </svg>
  )
}

/**
 * 纸面：扫描材质 × 物件颜色，叠加边缘陈旧与朝向台灯的明暗（--la）。
 * rough 为真时底层加毛边滤镜；clip 裁出撕边、折角等外形（会一并裁掉子元素）。
 */
function Surface({
  texture,
  tint,
  aged = 0.28,
  rough = true,
  clip,
  className,
  style,
  children,
}: {
  texture: keyof typeof TEXTURES
  tint: string
  aged?: number
  rough?: boolean
  clip?: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
}) {
  const { src, size } = TEXTURES[texture]
  return (
    <span className={cn('relative block', className)} style={{ ...style, clipPath: clip }}>
      <span
        aria-hidden
        className='absolute inset-0'
        style={{
          backgroundColor: tint,
          backgroundImage: [
            'linear-gradient(var(--la, 150deg), rgba(255,246,226,.55), rgba(255,246,226,0) 40%, rgba(0,0,0,0) 60%, rgba(40,20,5,.3))',
            `radial-gradient(ellipse at 50% 45%, transparent 52%, rgba(110,70,25,${aged}) 100%)`,
            `url(${src})`,
          ].join(','),
          backgroundBlendMode: 'soft-light, multiply, multiply',
          backgroundSize: `100% 100%, 100% 100%, ${size}`,
          filter: rough ? 'url(#dp-rough)' : undefined,
        }}
      />
      <span className='relative block size-full'>{children}</span>
    </span>
  )
}

/** 折起的角：翻过来的纸背，靠折线一侧更暗。 */
function FoldedCorner({ corner, size, tint }: { corner: 'bottom-right' | 'top-right'; size: string; tint: string }) {
  const bottom = corner === 'bottom-right'
  return (
    <span
      aria-hidden
      className={cn('absolute right-0', bottom ? 'bottom-0' : 'top-0')}
      style={{
        width: size,
        height: size,
        clipPath: bottom ? 'polygon(0 0, 100% 0, 0 100%)' : 'polygon(0 0, 0 100%, 100% 100%)',
        backgroundColor: tint,
        backgroundImage: bottom
          ? 'linear-gradient(135deg, rgba(255,250,235,.55), rgba(255,250,235,.1) 45%, rgba(60,35,10,.35))'
          : 'linear-gradient(45deg, rgba(255,250,235,.55), rgba(255,250,235,.1) 45%, rgba(60,35,10,.35))',
        filter: 'drop-shadow(-1px -1px 1.5px rgba(30,15,5,.35))',
      }}
    />
  )
}

/** 红笔画出的线：进入 drawn 状态后按 delay 依次描出。 */
function PenStroke({ d, drawn, delay, width = 1.6 }: { d: string; drawn: boolean; delay: number; width?: number }) {
  return (
    <path
      d={d}
      pathLength={1}
      fill='none'
      stroke={PEN}
      strokeWidth={width}
      strokeLinecap='round'
      strokeLinejoin='round'
      vectorEffect='non-scaling-stroke'
      className='transition-[stroke-dashoffset] duration-[900ms] ease-in-out-quart'
      style={{ strokeDasharray: 1, strokeDashoffset: drawn ? 0 : 1, transitionDelay: `${delay}ms` }}
    />
  )
}

function PaperClip({ className }: { className: string }) {
  return (
    <svg
      aria-hidden='true'
      viewBox='0 0 20 50'
      className={cn('overflow-visible drop-shadow-[1px_2px_1.5px_rgba(0,0,0,.45)]', className)}
    >
      <path
        d='M6 42 L6 8 C 6 2 14 2 14 8 L14 46 C 14 52 3 52 3 46 L3 14'
        fill='none'
        stroke='url(#dp-steel)'
        strokeWidth='2.2'
        strokeLinecap='round'
      />
    </svg>
  )
}

/** 红线（麻绳质感）：底色一道、扭纹一道。 */
function Twine({ d }: { d: string }) {
  return (
    <>
      <path d={d} fill='none' stroke='#6e2014' strokeWidth='2.4' strokeLinecap='round' />
      <path
        d={d}
        fill='none'
        stroke='rgba(255,170,140,.45)'
        strokeWidth='.8'
        strokeDasharray='1.6 2.4'
        strokeLinecap='round'
      />
    </>
  )
}

/**
 * 桌上的一件物件：外层定位并承接视差与光照变量（GSAP 只动外层），
 * 内层按钮负责倾角与悬停抬起（只过渡 --lift）。
 */
function DeskItem({
  className,
  depth,
  tilt,
  label,
  revealed,
  onReveal,
  onClick,
  children,
  extra,
}: {
  className: string
  depth: number
  tilt: number
  label: string
  revealed: boolean
  onReveal: () => void
  onClick: (item: HTMLElement) => void
  children: ReactNode
  extra?: ReactNode
}) {
  return (
    <div data-depth={depth} className={cn('@container absolute will-change-transform', className)}>
      <button
        type='button'
        aria-label={label}
        data-cursor={label}
        onClick={(event) => onClick(event.currentTarget)}
        onFocus={onReveal}
        className={cn(
          'relative block w-full text-left transition-[--lift] duration-500 ease-out-expo focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent',
          revealed ? 'hover:[--lift:1] focus-visible:[--lift:1]' : 'pointer-events-none',
        )}
        style={
          {
            '--tilt': `${tilt}deg`,
            filter: SHADOW,
            translate: '0 calc(var(--lift) * -9px)',
            scale: 'calc(1 + var(--lift) * .025)',
            rotate: 'calc(var(--tilt) * (1 - var(--lift) * .6))',
          } as CSSProperties
        }
      >
        {children}
        {extra}
      </button>
    </div>
  )
}

/** 绕线扣：纸垫 + 黄铜垫片，红线绕几圈后留一截线头。 */
function StringTie() {
  return (
    <svg
      aria-hidden='true'
      viewBox='0 0 60 140'
      className='absolute right-[7%] bottom-[7%] w-[12cqw] overflow-visible drop-shadow-[1px_2px_1.5px_rgba(30,15,5,.5)]'
    >
      {[24, 86].map((cy) => (
        <g key={cy}>
          <circle cx='30' cy={cy} r='17' fill='#b8915d' stroke='#7a5a30' strokeWidth='1' />
          <circle cx='30' cy={cy} r='15' fill='none' stroke='rgba(255,240,210,.35)' strokeWidth='.8' />
          <circle cx='30' cy={cy} r='10' fill='url(#dp-brass)' stroke='#4a3518' strokeWidth='.8' />
          <circle cx='30' cy={cy} r='2.6' fill='#3a2a12' />
        </g>
      ))}
      <Twine d='M30 24 C 50 42 10 68 30 86 C 50 68 10 42 30 24 C 52 46 8 64 30 86 C 46 104 40 122 32 136' />
    </svg>
  )
}

const SPLIT = 0.55

/**
 * 封面的一段：只显示整张封面画面中属于自己的那一条。
 * 正面按从左到右切分；内侧翻过来后左右镜像，所以切分方向相反。
 */
function CoverFace({
  side,
  segment,
  children,
}: {
  side: 'front' | 'back'
  segment: 'spine' | 'edge'
  children: ReactNode
}) {
  const share = segment === 'spine' ? SPLIT : 1 - SPLIT
  const offset =
    side === 'front' ? (segment === 'spine' ? 0 : SPLIT / (1 - SPLIT)) : segment === 'spine' ? (1 - SPLIT) / SPLIT : 0
  // 靠书脊的一段向接缝多伸 1px 并被外段盖住，消除分数像素接缝处的亮线；画面仍按原宽度换算，不会错位。
  const base = segment === 'spine' ? '(100% - 1px)' : '100%'
  return (
    <span
      className={cn(
        'absolute inset-y-0 left-0 block overflow-hidden text-left text-[#17120d] [backface-visibility:hidden]',
        segment === 'spine' ? '-right-px' : 'right-0',
        side === 'back' && '[transform:rotateY(180deg)]',
      )}
    >
      <span
        className='absolute inset-y-0 block'
        style={{ width: `calc(${base} * ${1 / share})`, left: `calc(${base} * ${-offset})` }}
      >
        {children}
      </span>
      <span data-shade={side} className='pointer-events-none absolute inset-0 bg-black opacity-0' />
    </span>
  )
}

/** 封面正面的完整画面。 */
function CoverFront() {
  const { t } = useTranslation()
  const zh = usePreferencesStore((state) => state.locale) === 'zh-CN'
  return (
    <>
      <Surface
        texture='cardboard'
        tint='#e3c186'
        aged={0.3}
        className='size-full shadow-[inset_-1.5px_0_0_rgba(255,238,200,.6),inset_0_-1px_0_rgba(90,55,20,.4)]'
        clip={cutBottomRight('9cqw')}
      >
        {/* 书脊压线、手摸发暗的开口边、咖啡杯印 */}
        <span className='absolute inset-y-0 left-[5cqw] w-[2px] bg-[linear-gradient(90deg,rgba(80,50,20,.4),rgba(255,240,210,.5))]' />
        <span className='absolute inset-y-0 right-0 w-[20%] bg-[linear-gradient(to_left,rgba(70,40,15,.3),transparent)] mix-blend-multiply' />
        <span className='absolute inset-x-0 bottom-0 h-[14%] bg-[linear-gradient(to_top,rgba(70,40,15,.22),transparent)] mix-blend-multiply' />
        <span
          className='absolute top-[58%] left-[44%] size-[30cqw] rotate-[24deg] rounded-full mix-blend-multiply [filter:url(#dp-rough)]'
          style={{
            background:
              'radial-gradient(circle, transparent 60%, rgba(110,62,20,.2) 63%, rgba(110,62,20,.06) 66%, transparent 68%)',
            maskImage:
              'conic-gradient(from 20deg, #000 0deg, rgba(0,0,0,.35) 90deg, #000 150deg, rgba(0,0,0,.15) 230deg, transparent 280deg, rgba(0,0,0,.6) 330deg, #000 360deg)',
            WebkitMaskImage:
              'conic-gradient(from 20deg, #000 0deg, rgba(0,0,0,.35) 90deg, #000 150deg, rgba(0,0,0,.15) 230deg, transparent 280deg, rgba(0,0,0,.6) 330deg, #000 360deg)',
          }}
        />

        {/* 记号笔写的编号 */}
        <span className='absolute top-[4.5%] left-[10%] rotate-[-4deg] font-hand text-[8cqw] leading-none text-[#1d1d26]/85 [filter:url(#dp-type)]'>
          N°001
        </span>

        {/* 标签贴：一角翘起，胶边发黄 */}
        <span className='absolute top-[15%] right-[11%] left-[10%] block rotate-[-.6deg] drop-shadow-[0_1px_1.5px_rgba(40,20,5,.3)]'>
          <Surface texture='fine' tint='#f3ead6' aged={0.22} clip={cutTopRight('5cqw')}>
            <span className='absolute inset-0 border border-[#c9a55a]/35' />
            <span className='flex flex-col items-center gap-[2cqw] px-[5cqw] py-[5cqw] text-center [filter:url(#dp-type)]'>
              <span className='font-mono text-[2.3cqw] tracking-[.24em] uppercase'>{t('dp.hero.office')}</span>
              <span className='block h-px w-full bg-[#17120d]' />
              <span
                className={cn(
                  'block leading-[1]',
                  zh
                    ? 'font-serif-sc text-[15cqw] font-black tracking-[.04em]'
                    : 'font-heading text-[13.6cqw] font-semibold tracking-[-.02em]',
                )}
              >
                {t('deadpan.name')}
              </span>
              <span className='font-heading text-[3.6cqw] tracking-[.5em]'>{t('deadpan.english')}</span>
              <span className='block h-[4px] w-full border-y border-[#17120d]' />
              <span className='font-mono text-[2.3cqw] tracking-[.2em]'>CASE FILE 001—2026</span>
            </span>
          </Surface>
          <FoldedCorner corner='top-right' size='5cqw' tint='#e9dcc0' />
        </span>

        {/* 机密章：缺墨斑驳 */}
        <span
          className='absolute bottom-[13%] left-[10%] rotate-[-8deg] border-[0.8cqw] px-[2.4cqw] py-[1cqw] font-serif-sc text-[6.4cqw] font-black tracking-[.2em] opacity-90 mix-blend-multiply [filter:url(#dp-ink)]'
          style={{ borderColor: RED, color: RED }}
        >
          机密
        </span>

        <StringTie />
      </Surface>
      <FoldedCorner corner='bottom-right' size='9cqw' tint='#efd49e' />
    </>
  )
}

/** 封面内侧的完整画面。 */
function CoverBack() {
  const { t } = useTranslation()
  return (
    <Surface texture='cardboard' tint='#d6b173' aged={0.34} className='size-full'>
      <span className='absolute top-[10%] left-[12%] rotate-[-6deg] border-[0.6cqw] border-[#842219]/60 px-[2cqw] py-[1cqw] font-serif-sc text-[3.6cqw] font-bold tracking-[.2em] text-[#842219]/60 [filter:url(#dp-ink)]'>
        {t('dp.hero.office')}
      </span>
      <span className='absolute right-[6%] bottom-[5%] font-mono text-[2.6cqw] tracking-[.2em] text-[#17120d]/60 uppercase'>
        ← {t('dp.desk.close')}
      </span>
    </Surface>
  )
}

/** 案卷夹：双层卡纸，后片带标签；开口一侧露出内页纸边；封面沿书脊翻开，内页是开卷目录。 */
function CaseFolder({ revealed, onReveal }: { revealed: boolean; onReveal: () => void }) {
  const { t } = useTranslation()
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(false)
  // 合上的动画结束前一直保持在最上层，避免摆回来的封面被批注等压住。
  const [raised, setRaised] = useState(false)
  const hinge = useRef<HTMLButtonElement>(null)
  const flap = useRef<HTMLSpanElement>(null)
  const flight = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => () => void flight.current?.kill(), [])

  /** 按两段封面各自的角度设置明暗：转到侧面最暗，平放时恢复。 */
  const shade = () => {
    const a = hinge.current
    const b = flap.current
    if (!a || !b) return
    const spine = Number(gsap.getProperty(a, 'rotationY'))
    const edge = spine + Number(gsap.getProperty(b, 'rotationY'))
    const dim = (deg: number) => (Math.abs(Math.sin((deg * Math.PI) / 180)) * 0.55).toFixed(3)
    for (const face of a.querySelectorAll<HTMLElement>(':scope > span > [data-shade]')) face.style.opacity = dim(spine)
    for (const face of b.querySelectorAll<HTMLElement>(':scope > span > [data-shade]')) face.style.opacity = dim(edge)
  }

  const toggle = () => {
    const a = hinge.current
    const b = flap.current
    if (!a || !b) return
    const next = !open
    setOpen(next)
    if (next) setRaised(true)
    flight.current?.kill()
    if (reduced) {
      gsap.set(a, { rotationY: next ? -170 : 0 })
      gsap.set(b, { rotationY: 0 })
      shade()
      if (!next) setRaised(false)
      return
    }
    // 掀起一点 → 加速翻过去 → 落桌轻弹；外段先滞后弯起、再追上、最后拉直。
    const direction = next ? -1 : 1
    const timeline = gsap.timeline({
      onUpdate: shade,
      onComplete: () => {
        if (!next) setRaised(false)
      },
    })
    timeline
      .to(a, { rotationY: next ? -12 : -158, duration: 0.24, ease: 'power2.out' })
      .to(a, { rotationY: next ? -176 : 3, duration: 0.9, ease: 'power3.inOut' })
      .to(a, { rotationY: next ? -170 : 0, duration: 0.5, ease: 'back.out(2.6)' })
      .to(b, { rotationY: -direction * 28, duration: 0.46, ease: 'power2.out' }, 0.08)
      .to(b, { rotationY: direction * 7, duration: 0.5, ease: 'power2.inOut' }, 0.54)
      .to(b, { rotationY: 0, duration: 0.5, ease: 'power2.out' }, 1.04)
    flight.current = timeline
  }

  return (
    <div
      data-depth={0.5}
      className={cn(
        '@container absolute top-[4%] left-[5%] w-[90%] will-change-transform md:top-[7%] md:left-[21%] md:w-[min(36%,calc((100svh-200px)*.72))]',
        raised ? 'z-30' : 'z-20',
      )}
    >
      <div
        className={cn(
          'relative aspect-[.8] w-full transition-[--lift,rotate] duration-700 ease-out-expo [perspective:2200px]',
          revealed && !raised && 'hover:[--lift:.6]',
          raised ? 'rotate-0' : 'rotate-[-2deg]',
        )}
        style={{ translate: '0 calc(var(--lift) * -7px)' }}
      >
        {/* 阴影单独一层：不再用滤镜包住会翻动的封面，翻页时不必逐帧重算滤镜。 */}
        <span
          aria-hidden
          className='absolute inset-x-0 -top-[7cqw] bottom-0'
          style={{
            boxShadow:
              'calc(var(--sx, 3) * .16px) calc(var(--sy, 5) * .16px) 2px rgba(20,10,4,.55), calc(var(--sx, 3) * (1px + var(--lift) * 1.4px)) calc(var(--sy, 5) * (1px + var(--lift) * 1.4px)) calc(12px + var(--lift) * 18px) rgba(20,10,4,.45)',
          }}
        />
        {/* 翻开后平放在桌上的封面投下的影子 */}
        <span
          aria-hidden
          className={cn(
            'absolute inset-y-[1%] right-full w-[97%] shadow-[-6px_10px_22px_rgba(20,10,4,.45)] transition-opacity duration-500',
            open ? 'opacity-100 delay-700' : 'opacity-0',
          )}
        />
        {/* 后片：比前片高一截，标签长在后片上 */}
        <Surface
          texture='cardboard'
          tint='#c99f5f'
          aged={0.35}
          className='absolute! inset-x-0 -top-[7cqw] bottom-0'
          clip='polygon(0 7cqw, 58% 7cqw, 61% 0, 91% 0, 94% 7cqw, 100% 7cqw, 100% 100%, 0 100%)'
        >
          <span className='absolute top-[1.6cqw] left-[64%] font-mono text-[2.6cqw] font-bold tracking-[.18em] text-[#17120d]/80 [filter:url(#dp-type)]'>
            CASE 001
          </span>
        </Surface>
        <svg
          aria-hidden='true'
          viewBox='0 0 100 40'
          preserveAspectRatio='none'
          className='absolute -top-[11cqw] right-[3cqw] z-10 h-[15cqw] w-[36cqw] overflow-visible'
        >
          <PenStroke d='M50 6 C 20 4 4 16 8 26 C 12 36 80 38 92 26 C 100 16 80 4 46 8' drawn={revealed} delay={1500} />
        </svg>

        {/* 夹在里面的纸：边缘参差地露出来 */}
        <Surface
          texture='fine'
          tint='#e8dcc1'
          aged={0.4}
          className='absolute! top-[3%] -right-[2.4%] -bottom-[1.6%] left-[2%] rotate-[.9deg]'
        />
        <Surface
          texture='fine'
          tint='#efe5cf'
          aged={0.32}
          className='absolute! top-[5%] -right-[1.2%] -bottom-[.6%] left-[3%] rotate-[-.5deg]'
        />
        <PaperClip className='absolute top-[20%] -right-[4.6cqw] w-[5cqw] rotate-[92deg]' />

        {/* 内页：开卷目录 */}
        <div inert={!open} className='absolute inset-[2.5%]'>
          <Surface texture='fine' tint='#f6eedb' aged={0.24} className='size-full'>
            <span
              className='flex size-full flex-col gap-[2.6cqw] p-[6cqw] text-[#17120d] [filter:url(#dp-type)]'
              style={{
                backgroundImage:
                  'repeating-linear-gradient(180deg, transparent 0 calc(6.2cqw - 1px), rgba(70,110,170,.16) calc(6.2cqw - 1px) 6.2cqw)',
              }}
            >
              <span className='flex items-baseline justify-between border-b-[3px] border-double border-[#17120d] pb-[2cqw]'>
                <span className='font-serif-sc text-[4.6cqw] font-bold tracking-[.2em]'>{t('dp.desk.contents')}</span>
                <span className='font-mono text-[2.4cqw] tracking-[.16em]'>CASE 001</span>
              </span>
              <span className='font-mono text-[2.4cqw] tracking-[.18em] uppercase' style={{ color: RED }}>
                {t('deadpan.label')}
              </span>
              <span className='font-serif-sc text-[3.5cqw] leading-[1.75]'>
                <TypedText text={t('deadpan.description')} active={open} speed={24} />
              </span>
              <span className='block border-t border-[#17120d]/25'>
                {(['meta1', 'meta2', 'meta3'] as const).map((key, index) => (
                  <span
                    key={key}
                    className='flex items-center gap-[2.4cqw] border-b border-[#17120d]/25 py-[1.6cqw] text-[3.2cqw]'
                  >
                    <svg aria-hidden='true' viewBox='0 0 24 24' className='size-[4.4cqw] shrink-0 overflow-visible'>
                      <rect x='2' y='2' width='20' height='20' fill='none' stroke={INK} strokeOpacity='.5' />
                      <PenStroke d='M5 13 L10 18 L21 3' drawn={open} delay={900 + index * 320} width={2.4} />
                    </svg>
                    {t(`deadpan.${key}`)}
                  </span>
                ))}
              </span>
              <span className='mt-auto flex items-center gap-[1.6cqw] font-mono text-[2.3cqw] tracking-[.16em] uppercase'>
                <span className='size-[1.4cqw] animate-pulse' style={{ backgroundColor: RED }} />
                {t('deadpan.status')}
              </span>
              <span className='flex flex-wrap gap-[2cqw]'>
                <a
                  href={DEADPAN_URL}
                  target='_blank'
                  rel='noreferrer'
                  className='flex items-center gap-[1.2cqw] bg-[#17120d] px-[3.4cqw] py-[2cqw] text-[2.6cqw] font-semibold tracking-[.14em] text-[#f7efdc] uppercase no-underline transition-colors hover:bg-[#842219]'
                >
                  {t('deadpan.play')} <ArrowUpRight className='size-[3cqw]' />
                </a>
                <button
                  type='button'
                  onClick={() => travel({ targetId: 'dp-catalog-title', label: `01 ${t('dp.chapters.open')}` })}
                  className='flex items-center gap-[1.2cqw] border border-[#17120d]/50 px-[3.4cqw] py-[2cqw] text-[2.6cqw] font-semibold tracking-[.14em] uppercase transition-colors hover:border-[#842219] hover:text-[#842219]'
                >
                  {t('dp.hero.scroll')} <ArrowDown className='size-[3cqw]' />
                </button>
              </span>
            </span>
          </Surface>
        </div>

        {/* 封面：分两段（靠书脊 55% + 外侧 45%），翻动时外段滞后，像卡纸一样弯起 */}
        <button
          ref={hinge}
          type='button'
          aria-expanded={open}
          aria-label={open ? t('dp.desk.close') : `${t('dp.hero.stamp')} · ${t('deadpan.name')}`}
          data-cursor={open ? t('dp.desk.close') : t('dp.hero.stamp')}
          onFocus={onReveal}
          onClick={toggle}
          className={cn(
            'absolute inset-y-0 left-0 w-[55%] origin-left will-change-transform [transform-style:preserve-3d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent',
            !revealed && 'pointer-events-none',
          )}
        >
          <CoverFace side='front' segment='spine'>
            <CoverFront />
          </CoverFace>
          <CoverFace side='back' segment='spine'>
            <CoverBack />
          </CoverFace>
          <span
            ref={flap}
            className='absolute inset-y-0 left-full w-[calc(100%*45/55)] origin-left will-change-transform [transform-style:preserve-3d]'
          >
            <CoverFace side='front' segment='edge'>
              <CoverFront />
            </CoverFace>
            <CoverFace side='back' segment='edge'>
              <CoverBack />
            </CoverFace>
          </span>
        </button>
      </div>
    </div>
  )
}

/**
 * 首屏灰尘下的调查桌：案卷夹可开合；剪报、索引卡、便签、证物牌分别通往见报、案卷总目、盘问、推理。
 * 台灯决定每件物件的高光朝向与阴影方向；拂尘完成后灯光与物件随指针移动，红笔批注逐条画出。
 */
export function InvestigationDesk({ revealed, onReveal }: { revealed: boolean; onReveal: () => void }) {
  const { t } = useTranslation()
  const zh = usePreferencesStore((state) => state.locale) === 'zh-CN'
  const fine = useFinePointer()
  const reduced = useReducedMotion()
  const root = useRef<HTMLDivElement>(null)
  const drawn = revealed

  // 光照：按台灯位置给每件物件写入阴影方向（--sx/--sy）与高光角度（--la）；拂尘完成后灯光与视差随指针移动。
  useEffect(() => {
    const desk = root.current
    if (!desk) return
    const objects = [...desk.querySelectorAll<HTMLElement>('[data-depth]')]
    const light = { x: LAMP.x, y: LAMP.y, tx: LAMP.x, ty: LAMP.y }

    const paint = () => {
      const rect = desk.getBoundingClientRect()
      desk.style.setProperty('--lx', `${(light.x * 100).toFixed(2)}%`)
      desk.style.setProperty('--ly', `${(light.y * 100).toFixed(2)}%`)
      const lampX = light.x * rect.width
      const lampY = light.y * rect.height
      for (const element of objects) {
        const box = element.getBoundingClientRect()
        const dx = box.left - rect.left + box.width / 2 - lampX
        const dy = box.top - rect.top + box.height / 2 - lampY
        const distance = Math.max(Math.hypot(dx, dy), 1)
        const reach = (5 + Number(element.dataset.depth) * 9) * (0.55 + distance / rect.width)
        element.style.setProperty('--sx', ((dx / distance) * reach).toFixed(2))
        element.style.setProperty('--sy', ((dy / distance) * reach).toFixed(2))
        element.style.setProperty('--la', `${((Math.atan2(dx, -dy) * 180) / Math.PI).toFixed(1)}deg`)
      }
    }
    paint()
    const resize = new ResizeObserver(paint)
    resize.observe(desk)
    if (!revealed || !fine || reduced) return () => resize.disconnect()

    const layers = objects.map((element) => ({
      depth: Number(element.dataset.depth),
      x: gsap.quickTo(element, 'x', { duration: 1, ease: 'power3' }),
      y: gsap.quickTo(element, 'y', { duration: 1, ease: 'power3' }),
    }))
    let frame = 0
    const step = () => {
      light.x += (light.tx - light.x) * 0.08
      light.y += (light.ty - light.y) * 0.08
      paint()
      frame = Math.abs(light.tx - light.x) + Math.abs(light.ty - light.y) > 0.0005 ? requestAnimationFrame(step) : 0
    }
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(step)
    }
    const move = (event: PointerEvent) => {
      const rect = desk.getBoundingClientRect()
      const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2
      const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2
      for (const layer of layers) {
        layer.x(-nx * layer.depth * 14)
        layer.y(-ny * layer.depth * 10)
      }
      light.tx = LAMP.x + 0.28 + nx * 0.34
      light.ty = LAMP.y + 0.2 + ny * 0.26
      kick()
    }
    const leave = () => {
      for (const layer of layers) {
        layer.x(0)
        layer.y(0)
      }
      light.tx = LAMP.x
      light.ty = LAMP.y
      kick()
    }
    desk.addEventListener('pointermove', move)
    desk.addEventListener('pointerleave', leave)
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      desk.removeEventListener('pointermove', move)
      desk.removeEventListener('pointerleave', leave)
    }
  }, [revealed, fine, reduced])

  const notes = [
    {
      key: 'open',
      number: '01',
      className: 'top-[42%] left-[59%]',
      path: 'M6 6 C 20 22 30 34 40 52',
      arrow: 'M32 48 L40 52 L40 43',
    },
    {
      key: 'ask',
      number: '02',
      className: 'top-[89%] left-[5%]',
      path: 'M58 -34 C 70 -44 72 -58 64 -72',
      arrow: 'M58 -64 L64 -72 L70 -63',
    },
    {
      key: 'deduce',
      number: '03',
      className: 'top-[41%] left-[14%]',
      path: 'M40 8 C 30 -6 14 -8 4 -22',
      arrow: 'M4 -12 L4 -22 L12 -16',
    },
    {
      key: 'publish',
      number: '04',
      className: 'top-[22%] left-[88.5%]',
      path: 'M14 30 C 10 18 6 10 -6 4',
      arrow: 'M2 2 L-6 4 L-1 11',
    },
  ] as const

  return (
    <div ref={root} className='absolute inset-0' style={{ '--lx': '22%', '--ly': '6%' } as CSSProperties}>
      <DeskDefs />

      {/* 皮革台垫：缝线与四角包皮 */}
      <div
        className='absolute inset-[3%] shadow-[0_8px_24px_rgba(0,0,0,.5),inset_0_0_50px_rgba(0,0,0,.55)]'
        style={{
          backgroundColor: '#3a2618',
          backgroundImage: `radial-gradient(ellipse at 50% 40%, rgba(255,210,150,.08), transparent 70%), url(${deskLeather})`,
          backgroundSize: '100% 100%, 420px',
          backgroundBlendMode: 'screen, normal',
        }}
      >
        <span className='absolute inset-[10px] border border-dashed border-[#caa06a]/25' />
        {(
          [
            'top-0 left-0',
            'top-0 right-0 rotate-90',
            'right-0 bottom-0 rotate-180',
            'bottom-0 left-0 -rotate-90',
          ] as const
        ).map((position) => (
          <span
            key={position}
            className={cn('absolute hidden size-[9%] md:block', position)}
            style={{
              clipPath: 'polygon(0 0, 100% 0, 0 100%)',
              backgroundColor: '#24160d',
              backgroundImage: `linear-gradient(135deg, rgba(255,220,170,.08), transparent 60%), url(${deskLeather})`,
              backgroundSize: '100% 100%, 300px',
              backgroundBlendMode: 'screen, multiply',
              filter: 'drop-shadow(2px 2px 3px rgba(0,0,0,.5))',
            }}
          />
        ))}
      </div>

      {/* 咖啡杯印 */}
      <div
        aria-hidden
        className='absolute top-[64%] left-[46%] hidden aspect-square w-[10%] rounded-full mix-blend-multiply [filter:url(#dp-rough)] md:block'
        style={{
          background:
            'radial-gradient(circle, rgba(40,20,5,.12) 48%, transparent 56%, rgba(30,15,5,.45) 60%, rgba(30,15,5,.2) 64%, transparent 69%)',
        }}
      />

      {/* 证物牌 → 推理 */}
      <DeskItem
        className='top-[7%] left-[5%] hidden w-[11%] md:block'
        depth={1}
        tilt={-9}
        label={`03 ${t('dp.chapters.deduce')}`}
        revealed={revealed}
        onReveal={onReveal}
        onClick={(item) => travel({ targetId: 'dp-board-title', label: `03 ${t('dp.chapters.deduce')}`, from: item })}
        extra={
          <svg
            aria-hidden='true'
            viewBox='0 0 40 60'
            className='absolute -top-[40cqw] left-[30cqw] w-[40cqw] overflow-visible drop-shadow-[1px_2px_1px_rgba(0,0,0,.45)]'
          >
            <Twine d='M20 58 C 16 40 30 30 22 16 C 16 6 26 0 34 -4' />
          </svg>
        }
      >
        <Surface texture='kraft' tint='#c7985a' aged={0.34} rough={false} clip={TAG_SHAPE} className='aspect-[.55]'>
          <span
            className='absolute top-[7cqw] left-1/2 size-[15cqw] -translate-x-1/2 rounded-full shadow-[0_1px_1px_rgba(0,0,0,.3)]'
            style={{ background: 'radial-gradient(circle, #1b130c 38%, #ead7ae 41%, #d9c296 64%, #b89a68 68%)' }}
          />
          <span className='flex flex-col gap-[4cqw] px-[9cqw] pt-[30cqw] pb-[8cqw] text-[#17120d]'>
            <span className='font-mono text-[7cqw] font-bold tracking-[.1em] [filter:url(#dp-ink)]'>
              N°03 · {t('dp.desk.clues')}
            </span>
            <span className='block h-px bg-[#17120d]/40' />
            {(['contradiction', 'omission', 'crease'] as const).map((key) => (
              <span
                key={key}
                className={cn(
                  'font-hand leading-[1.1] text-[#2f2f33]/85 [filter:url(#dp-type)]',
                  zh ? 'text-[12cqw]' : 'text-[13cqw]',
                )}
              >
                {t(`dp.board.${key}`)}
              </span>
            ))}
          </span>
        </Surface>
      </DeskItem>

      {/* 讯问笔录便签 → 盘问 */}
      <DeskItem
        className='top-[53%] left-[3.5%] hidden w-[15%] md:block'
        depth={0.8}
        tilt={5}
        label={`02 ${t('dp.chapters.ask')}`}
        revealed={revealed}
        onReveal={onReveal}
        onClick={(item) => travel({ targetId: 'dp-ask-title', label: `02 ${t('dp.chapters.ask')}`, from: item })}
        extra={
          <span aria-hidden className='absolute inset-x-[6cqw] -top-[3cqw] flex justify-between'>
            {RINGS.map((ring) => (
              <svg key={ring} aria-hidden='true' viewBox='0 0 10 16' className='w-[5cqw] overflow-visible'>
                <path
                  d='M2 13 C 1 3, 9 3, 8 13'
                  fill='none'
                  stroke='url(#dp-steel)'
                  strokeWidth='1.6'
                  strokeLinecap='round'
                />
              </svg>
            ))}
          </span>
        }
      >
        <Surface texture='fine' tint='#f2e3ad' aged={0.3} clip={cutBottomRight('10cqw')} className='aspect-[.8]'>
          <span
            className='absolute inset-0'
            style={{
              backgroundImage:
                'linear-gradient(90deg, transparent 12%, rgba(184,50,31,.45) 12% calc(12% + 1px), transparent calc(12% + 1px) calc(13% + 1px), rgba(184,50,31,.35) calc(13% + 1px) calc(13% + 2px), transparent calc(13% + 2px)), repeating-linear-gradient(180deg, transparent 0 calc(11cqw - 1px), rgba(70,110,170,.32) calc(11cqw - 1px) 11cqw)',
              backgroundPosition: '0 0, 0 13cqw',
            }}
          />
          <span className='absolute inset-x-[6cqw] top-[3cqw] flex justify-between'>
            {RINGS.map((hole) => (
              <span
                key={hole}
                className='size-[3.4cqw] rounded-full bg-[#1c130c] shadow-[inset_0_1px_1px_rgba(0,0,0,.6)]'
              />
            ))}
          </span>
          <span className='flex flex-col gap-[4cqw] px-[9cqw] pt-[14cqw] pb-[8cqw]'>
            <span className='font-mono text-[6.4cqw] font-bold tracking-[.14em] text-[#17120d] [filter:url(#dp-type)]'>
              {t('dp.ask.record')}
            </span>
            <span className='font-hand text-[13cqw] leading-[1.15] text-[#1f3b8a] [filter:url(#dp-type)]'>
              {t('dp.ask.q')}：{t('pillars.oneTitle')}
            </span>
          </span>
          <FoldedCorner corner='bottom-right' size='10cqw' tint='#e8d59a' />
        </Surface>
      </DeskItem>

      <CaseFolder revealed={revealed} onReveal={onReveal} />

      {/* 剪报 → 见报 */}
      <DeskItem
        className='top-[63%] left-[42%] w-[54%] md:top-[5%] md:left-[61%] md:w-[26%]'
        depth={0.9}
        tilt={4}
        label={`04 ${t('dp.chapters.publish')}`}
        revealed={revealed}
        onReveal={onReveal}
        onClick={(item) => travel({ targetId: 'dp-paper-title', label: `04 ${t('dp.chapters.publish')}`, from: item })}
        extra={<PaperClip className='absolute -top-[5cqw] left-[12cqw] w-[6cqw]' />}
      >
        <Surface texture='crumpled' tint='#e8dab8' aged={0.34} rough={false} clip={CLIPPING_EDGE}>
          <span className='absolute inset-0 bg-[radial-gradient(ellipse_at_85%_95%,rgba(150,105,35,.28),transparent_55%)] mix-blend-multiply' />
          <span className='absolute inset-x-0 top-[48%] h-[4px] bg-[linear-gradient(180deg,rgba(60,40,15,.2),rgba(255,250,235,.55),rgba(60,40,15,.14))]' />
          <span className='flex flex-col gap-[3cqw] px-[7cqw] pt-[8cqw] pb-[9cqw] text-[#17120d] [filter:url(#dp-type)]'>
            <span
              className={cn(
                'text-center leading-none',
                zh ? 'font-serif-sc text-[12cqw] font-black tracking-[.24em]' : 'font-heading text-[8.4cqw] font-bold',
              )}
            >
              {t('dp.paper.masthead')}
            </span>
            <span className='block h-[4px] border-y border-[#17120d]' />
            <span
              className='w-fit px-[2cqw] py-[.8cqw] font-mono text-[2.8cqw] tracking-[.14em] text-[#f7efdc]'
              style={{ backgroundColor: RED }}
            >
              {t('dp.paper.kicker')}
            </span>
            <span className='font-serif-sc text-[8.6cqw] leading-[1.12] font-black text-balance'>
              {t('signal.title')}
            </span>
            <span className='line-clamp-4 font-serif-sc text-[3.8cqw] leading-[1.65] text-[#17120d]/80'>
              {t('signal.body')}
            </span>
          </span>
        </Surface>
      </DeskItem>

      {/* 索引卡 → 案卷总目 */}
      <DeskItem
        className='top-[73%] left-[3%] w-[52%] md:top-[53%] md:left-[63%] md:w-[28%]'
        depth={0.7}
        tilt={-4}
        label={`01 ${t('dp.chapters.open')}`}
        revealed={revealed}
        onReveal={onReveal}
        onClick={(item) => travel({ targetId: 'dp-catalog-title', label: `01 ${t('dp.chapters.open')}`, from: item })}
      >
        <Surface texture='fine' tint='#f7f1e3' aged={0.22} clip={cutTopRight('7cqw')} className='aspect-[5/3]'>
          <span
            className='absolute inset-0'
            style={{
              backgroundImage:
                'linear-gradient(90deg, transparent 11%, rgba(184,50,31,.45) 11% calc(11% + 1px), transparent calc(11% + 1px)), repeating-linear-gradient(180deg, transparent 0 calc(8cqw - 1px), rgba(70,110,170,.32) calc(8cqw - 1px) 8cqw)',
              backgroundPosition: '0 0, 0 4cqw',
            }}
          />
          <span className='flex flex-col px-[6cqw] pt-[4cqw] text-[#17120d] [filter:url(#dp-type)]'>
            <span className='flex h-[8cqw] items-center justify-between border-b-2 border-[#b8321f]/70 pr-[6cqw] font-mono text-[3.6cqw] font-bold tracking-[.16em]'>
              <span>{t('dp.catalog.title')}</span>
              <span>N°001—005</span>
            </span>
            {CASE_ARCHIVE.slice(0, 5).map((item, index) => (
              <span key={item.name} className='relative flex h-[8cqw] items-center gap-[3cqw] text-[3.5cqw]'>
                <span className='font-mono text-[2.6cqw] text-[#17120d]/60'>0{index + 1}</span>
                <span className='font-serif-sc font-semibold'>{item.name}</span>
                <span className='ml-auto font-mono text-[2.6cqw] text-[#17120d]/60'>{t(`dp.types.${item.type}`)}</span>
                {index === 2 ? (
                  <svg
                    aria-hidden='true'
                    viewBox='0 0 100 10'
                    preserveAspectRatio='none'
                    className='absolute inset-x-[6cqw] bottom-[.6cqw] h-[2cqw] overflow-visible'
                  >
                    <PenStroke d='M0 6 C 20 3 45 8 60 5 S 90 4 100 6' drawn={drawn} delay={2200} width={2} />
                  </svg>
                ) : null}
              </span>
            ))}
          </span>
          <span
            className='absolute bottom-[4cqw] left-1/2 size-[4.4cqw] -translate-x-1/2 rounded-full'
            style={{ background: 'radial-gradient(circle, #1b130c 55%, rgba(0,0,0,.35) 62%, transparent 72%)' }}
          />
          <FoldedCorner corner='top-right' size='7cqw' tint='#ece3cf' />
        </Surface>
      </DeskItem>

      {/* 红铅笔（装饰）：六棱笔杆、金属箍、橡皮、削过的笔尖 */}
      <div
        data-depth={0.4}
        aria-hidden
        className='absolute top-[88%] left-[40%] hidden w-[17%] rotate-[-12deg] will-change-transform md:block'
      >
        <div className='flex h-[13px] items-stretch' style={{ filter: SHADOW }}>
          <span className='w-[7%] bg-[linear-gradient(180deg,#e7b3ad,#c98a84_55%,#a2645e)]' />
          <span className='w-[5%] bg-[repeating-linear-gradient(90deg,#d9dde1_0_2px,#8b939b_2px_3px)]' />
          <span className='flex-1 bg-[linear-gradient(180deg,#e0664f_0%,#b8321f_30%,#8f2415_32%,#a62b1a_62%,#6d1c10_64%,#4f140b_100%)]' />
          <span className='relative w-[11%] bg-[linear-gradient(180deg,#f0dcb8,#d1b184_60%,#a8875a)] [clip-path:polygon(0_0,100%_44%,100%_56%,0_100%)]'>
            <span className='absolute inset-y-0 right-0 w-[34%] bg-[#2f2f33] [clip-path:polygon(0_30%,100%_50%,0_70%)]' />
          </span>
        </div>
      </div>

      {/* 红笔批注：手写的章节目录 */}
      <div aria-hidden className='pointer-events-none absolute inset-0 z-[25] hidden [filter:url(#dp-type)] md:block'>
        {notes.map((note, index) => (
          <div key={note.key} className={cn('absolute', note.className)}>
            <span
              className={cn(
                'block font-hand leading-none whitespace-nowrap transition-opacity duration-700',
                zh ? 'text-[clamp(1.3rem,1.9vw,1.9rem)]' : 'text-[clamp(1.4rem,2vw,2rem)]',
                drawn ? 'opacity-100' : 'opacity-0',
              )}
              style={{ color: PEN, transitionDelay: `${700 + index * 380}ms`, rotate: `${index % 2 ? 4 : -5}deg` }}
            >
              {note.number} {t(`dp.chapters.${note.key}`)}
            </span>
            <svg aria-hidden='true' viewBox='0 0 80 70' className='absolute top-full left-0 w-[5vw] overflow-visible'>
              <PenStroke d={note.path} drawn={drawn} delay={900 + index * 380} />
              <PenStroke d={note.arrow} drawn={drawn} delay={1300 + index * 380} />
            </svg>
          </div>
        ))}
      </div>

      {/* 台灯光斑：随灯光位置移动，照亮桌面与物件，远处压暗 */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 z-[26] mix-blend-soft-light'
        style={{
          background:
            'radial-gradient(circle at var(--lx) var(--ly), rgba(255,214,150,.7), rgba(255,214,150,.18) 32%, rgba(0,0,0,0) 55%, rgba(0,0,0,.45) 100%)',
        }}
      />
    </div>
  )
}
