import type { CSSProperties, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import deskLeather from '@/assets/textures/desk-leather.webp'
import { cn } from '@/lib/utils'
import { usePreferencesStore } from '@/stores/preferences-store'

import { CASE_ARCHIVE, CASE_LEVELS } from './case-archive'
import {
  CLIPPING_EDGE,
  cutBottomRight,
  cutTopRight,
  DeskDefs,
  FoldedCorner,
  PaperClip,
  RINGS,
  SHADOW,
  Surface,
  TAG_SHAPE,
  Twine,
} from './deadpan-desk'
import { PAPER_STYLE } from './deadpan-hero'

/** 桌面皮革：整页共用的背景，边缘压暗并融进页面底色，中间有台灯的暖光。 */
export function DeskBackdrop() {
  return (
    <div
      aria-hidden
      className='absolute inset-0 [mask-image:linear-gradient(to_bottom,#000_0,#000_86%,transparent_100%)]'
      style={{
        backgroundColor: '#3a2618',
        backgroundImage: [
          'radial-gradient(ellipse at 50% 40%, rgba(255,214,150,.2), transparent 62%)',
          'radial-gradient(ellipse at 50% 46%, transparent 48%, rgba(8,4,2,.82) 100%)',
          `url(${deskLeather})`,
        ].join(','),
        backgroundSize: '100% 100%, 100% 100%, 560px',
        backgroundBlendMode: 'screen, multiply, normal',
      }}
    />
  )
}

/** 擦过之后留下的痕迹：中间干净，桌边与书未擦到的边缘仍蒙着薄灰。 */
export function EdgeDust({ shown }: { shown: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 transition-opacity duration-[1600ms] ease-out',
        shown ? 'opacity-100' : 'opacity-0',
      )}
      style={{
        background:
          'radial-gradient(ellipse at 50% 48%, transparent 38%, rgba(150,132,106,.16) 66%, rgba(120,104,84,.34) 100%)',
        mixBlendMode: 'screen',
      }}
    />
  )
}

type Side = 'left' | 'right' | 'bottom' | 'top'

const HIDE: Record<Side, string> = {
  left: '-translate-x-24',
  right: 'translate-x-24',
  bottom: 'translate-y-24',
  top: '-translate-y-24',
}

/**
 * 桌上的一件物件：外层管显示与滑入滑出，内层管鼠标视差；视差量来自舞台上的 --mx/--my。
 * 物件是装饰，对读屏隐藏，也不接收指针。
 */
function Prop({
  shown,
  from,
  depth,
  tilt = 0,
  className,
  children,
}: {
  shown: boolean
  from: Side
  depth: number
  tilt?: number
  className: string
  children: ReactNode
}) {
  return (
    <div
      aria-hidden
      className={cn(
        '@container pointer-events-none absolute transition-[opacity,transform] duration-[900ms] ease-out-expo',
        shown ? 'translate-x-0 translate-y-0 opacity-100' : cn('opacity-0', HIDE[from]),
        className,
      )}
    >
      <div
        style={
          {
            '--lift': 0,
            translate: `calc(var(--mx, 0) * ${depth} * -18px) calc(var(--my, 0) * ${depth} * -12px)`,
            rotate: `${tilt}deg`,
            filter: SHADOW,
          } as CSSProperties
        }
      >
        {children}
      </div>
    </div>
  )
}

function TagBody() {
  const { t } = useTranslation()
  const zh = usePreferencesStore((state) => state.locale) === 'zh-CN'
  return (
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
  )
}

/** 证物牌：牛皮纸吊牌，三条线索，红线从穿线孔拉出去。 */
export function EvidenceTag(props: { shown: boolean; className: string; from?: Side; tilt?: number }) {
  return (
    <Prop shown={props.shown} from={props.from ?? 'left'} depth={1} tilt={props.tilt ?? -9} className={props.className}>
      <TagBody />
      <svg
        aria-hidden='true'
        viewBox='0 0 40 60'
        className='absolute -top-[40cqw] left-[30cqw] w-[40cqw] overflow-visible drop-shadow-[1px_2px_1px_rgba(0,0,0,.45)]'
      >
        <Twine d='M20 58 C 16 40 30 30 22 16 C 16 6 26 0 34 -4' />
      </svg>
    </Prop>
  )
}

/** 讯问笔录便签：螺旋装订，写着「问：没有标准问句」。 */
export function Notepad(props: { shown: boolean; className: string }) {
  const { t } = useTranslation()
  return (
    <Prop shown={props.shown} from='left' depth={0.8} tilt={5} className={props.className}>
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
    </Prop>
  )
}

/** 剪报：《奇案特刊》，回形针夹着。 */
export function Clipping(props: { shown: boolean; className: string }) {
  const { t } = useTranslation()
  const zh = usePreferencesStore((state) => state.locale) === 'zh-CN'
  return (
    <Prop shown={props.shown} from='right' depth={0.9} tilt={4} className={props.className}>
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
          <span className='w-fit bg-[#842219] px-[2cqw] py-[.8cqw] font-mono text-[2.8cqw] tracking-[.14em] text-[#f7efdc]'>
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
      <PaperClip className='absolute -top-[5cqw] left-[12cqw] w-[6cqw]' />
    </Prop>
  )
}

/** 索引卡：案卷总目前五宗。 */
export function IndexCard(props: { shown: boolean; className: string }) {
  const { t } = useTranslation()
  return (
    <Prop shown={props.shown} from='right' depth={0.7} tilt={-4} className={props.className}>
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
            </span>
          ))}
        </span>
        <FoldedCorner corner='top-right' size='7cqw' tint='#ece3cf' />
      </Surface>
    </Prop>
  )
}

/** 红铅笔：六棱笔杆、金属箍、橡皮、削过的笔尖。 */
export function Pencil(props: { shown: boolean; className: string; tilt?: number }) {
  return (
    <Prop shown={props.shown} from='bottom' depth={0.4} tilt={props.tilt ?? -12} className={props.className}>
      <div className='flex h-[13px] items-stretch'>
        <span className='w-[7%] bg-[linear-gradient(180deg,#e7b3ad,#c98a84_55%,#a2645e)]' />
        <span className='w-[5%] bg-[repeating-linear-gradient(90deg,#d9dde1_0_2px,#8b939b_2px_3px)]' />
        <span className='flex-1 bg-[linear-gradient(180deg,#e0664f_0%,#b8321f_30%,#8f2415_32%,#a62b1a_62%,#6d1c10_64%,#4f140b_100%)]' />
        <span className='relative w-[11%] bg-[linear-gradient(180deg,#f0dcb8,#d1b184_60%,#a8875a)] [clip-path:polygon(0_0,100%_44%,100%_56%,0_100%)]'>
          <span className='absolute inset-y-0 right-0 w-[34%] bg-[#2f2f33] [clip-path:polygon(0_30%,100%_50%,0_70%)]' />
        </span>
      </div>
    </Prop>
  )
}

/** 咖啡杯印。 */
export function CoffeeRing(props: { className: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute aspect-square rounded-full mix-blend-multiply [filter:url(#dp-rough)]',
        props.className,
      )}
      style={{
        background:
          'radial-gradient(circle, rgba(40,20,5,.12) 48%, transparent 56%, rgba(30,15,5,.45) 60%, rgba(30,15,5,.2) 64%, transparent 69%)',
      }}
    />
  )
}

/** 索引卡盒：一排卡片从木盒里探出来，盒前是铜牌。 */
export function CardBox(props: { shown: boolean; className: string }) {
  const { t } = useTranslation()
  return (
    <Prop shown={props.shown} from='left' depth={0.9} tilt={-3} className={props.className}>
      <div className='relative aspect-[1.55]'>
        {[0, 1, 2, 3, 4].map((card) => (
          <Surface
            key={card}
            texture='fine'
            tint={card % 2 ? '#f1e8d2' : '#f7f1e3'}
            aged={0.2}
            rough={false}
            className='absolute! inset-x-[7%] h-[60%]'
            style={{ top: `${2 + card * 5}%`, rotate: `${(card - 2) * 0.9}deg` }}
          >
            <span className='absolute inset-x-0 top-[12%] h-px bg-[#b8321f]/55' />
            <span className='absolute inset-x-[8%] top-[22%] font-mono text-[3.2cqw] font-bold tracking-[.14em] text-[#17120d]/75'>
              N°{String(card + 1).padStart(3, '0')}
            </span>
          </Surface>
        ))}
        <Surface
          texture='cardboard'
          tint='#8a5a34'
          aged={0.5}
          rough={false}
          className='absolute! inset-x-0 bottom-0 h-[46%]'
        >
          <span className='absolute top-[18%] left-1/2 flex -translate-x-1/2 items-center justify-center border border-[#3a2a12] bg-[linear-gradient(180deg,#e6c887,#b8914c)] px-[5cqw] py-[1.6cqw] font-mono text-[3cqw] font-bold tracking-[.16em] text-[#2b1d0b]'>
            {t('dp.catalog.title')} · {CASE_ARCHIVE.length}
          </span>
        </Surface>
      </div>
    </Prop>
  )
}

/** 放大镜：黄铜圈、玻璃高光、木柄。 */
export function Magnifier(props: { shown: boolean; className: string }) {
  return (
    <Prop shown={props.shown} from='right' depth={1.1} tilt={-18} className={props.className}>
      <svg aria-hidden='true' viewBox='0 0 120 190' className='w-full overflow-visible'>
        <defs>
          <radialGradient id='dp-glass' cx='.35' cy='.3' r='.8'>
            <stop offset='0' stopColor='rgba(255,255,255,.28)' />
            <stop offset='.6' stopColor='rgba(210,230,255,.08)' />
            <stop offset='1' stopColor='rgba(120,160,200,.18)' />
          </radialGradient>
          <linearGradient id='dp-wood' x1='0' y1='0' x2='1' y2='0'>
            <stop offset='0' stopColor='#2a1a0e' />
            <stop offset='.5' stopColor='#5a3a1e' />
            <stop offset='1' stopColor='#2a1a0e' />
          </linearGradient>
        </defs>
        <rect x='52' y='104' width='16' height='80' fill='url(#dp-wood)' />
        <rect x='48' y='96' width='24' height='14' fill='url(#dp-steel)' />
        <circle cx='60' cy='52' r='48' fill='url(#dp-glass)' stroke='url(#dp-brass)' strokeWidth='9' />
        <circle cx='60' cy='52' r='42' fill='none' stroke='rgba(60,40,10,.5)' strokeWidth='1' />
        <path
          d='M30 32 C 38 18 52 12 66 12'
          fill='none'
          stroke='rgba(255,255,255,.55)'
          strokeWidth='3'
          strokeLinecap='round'
        />
      </svg>
    </Prop>
  )
}

/** 推理章：红线从证物牌拉到书的左缘，两枚图钉按在桌面上。 */
export function DeskThread({ shown }: { shown: boolean }) {
  return (
    <svg
      aria-hidden='true'
      viewBox='0 0 100 100'
      preserveAspectRatio='none'
      className={cn(
        'pointer-events-none absolute inset-0 size-full transition-opacity duration-[900ms]',
        shown ? 'opacity-100' : 'opacity-0',
      )}
    >
      <path
        d='M6.3 22.6 C 12 33, 5 44, 13 50 S 17 56, 18.9 56.9'
        fill='none'
        stroke='#6e2014'
        strokeWidth='2.4'
        strokeLinecap='round'
        vectorEffect='non-scaling-stroke'
        style={{ filter: 'drop-shadow(1px 2px 1.5px rgba(0,0,0,.5))' }}
      />
      <path
        d='M8 25 C 12 33, 5 44, 13 50 S 18 56, 19.6 55'
        fill='none'
        stroke='rgba(255,170,140,.45)'
        strokeWidth='.8'
        strokeDasharray='1.6 2.4'
        strokeLinecap='round'
        vectorEffect='non-scaling-stroke'
      />
    </svg>
  )
}

export function Pushpin(props: { shown: boolean; className: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute size-4 rounded-full bg-[radial-gradient(circle_at_35%_30%,#ff8a70,#b8321f_55%,#6e140c)] shadow-[2px_3px_3px_rgba(0,0,0,.5)] transition-opacity duration-700',
        props.shown ? 'opacity-100' : 'opacity-0',
        props.className,
      )}
    />
  )
}

/** 悬停某宗案卷时，从书页「抽」到桌上的小卷宗卡。 */
export function DeskDossier({ index, shown, className }: { index: number | null; shown: boolean; className: string }) {
  const { t } = useTranslation()
  const item = index === null ? null : CASE_ARCHIVE[index]
  const rank = item ? CASE_LEVELS.indexOf(item.level) : 0
  return (
    <div
      aria-hidden
      className={cn(
        '@container pointer-events-none absolute transition-[opacity,transform] duration-500 ease-out-expo',
        shown && item ? 'translate-x-0 rotate-[5deg] opacity-100' : '-translate-x-16 rotate-[-4deg] opacity-0',
        className,
      )}
    >
      <div
        className='relative flex aspect-[.73] flex-col border border-[#7c6545] p-[9cqw] text-[#17120d] shadow-[14px_20px_40px_rgba(0,0,0,.5)]'
        style={PAPER_STYLE}
      >
        {item ? (
          <>
            <div className='flex justify-between border-b-2 border-current pb-[4cqw] font-mono text-[6cqw] font-bold tracking-[.12em]'>
              <span>CASE FILE</span>
              <span>N°{String((index ?? 0) + 1).padStart(3, '0')}</span>
            </div>
            <p
              className={cn(
                'mt-[8cqw] flex-1 font-serif-sc font-bold',
                item.edition === 'zh'
                  ? 'text-[16cqw] leading-[1.05] tracking-[.08em] [writing-mode:vertical-rl]'
                  : 'font-heading text-[15cqw] leading-[1.05]',
              )}
            >
              {item.name}
            </p>
            <div className='flex items-end justify-between'>
              <span className='rotate-[-6deg] border-2 border-[#842219] px-[3cqw] py-[1cqw] font-serif-sc text-[8cqw] font-bold text-[#842219]'>
                {t(`dp.types.${item.type}`)}
              </span>
              <span className='flex gap-[1.6cqw]'>
                {CASE_LEVELS.map((key, i) => (
                  <span key={key} className={cn('size-[4cqw] bg-current', i <= rank ? 'opacity-90' : 'opacity-20')} />
                ))}
              </span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

/** 墨水瓶与蘸水笔：盘问章的桌面。 */
export function Inkwell(props: { shown: boolean; className: string }) {
  return (
    <Prop shown={props.shown} from='right' depth={1} tilt={6} className={props.className}>
      <svg aria-hidden='true' viewBox='0 0 110 130' className='w-full overflow-visible'>
        <defs>
          <linearGradient id='dp-ink-glass' x1='0' y1='0' x2='1' y2='0'>
            <stop offset='0' stopColor='#0d1018' />
            <stop offset='.35' stopColor='#2a3350' />
            <stop offset='1' stopColor='#0a0c14' />
          </linearGradient>
        </defs>
        <path d='M96 18 C 78 34 60 40 40 52' fill='none' stroke='#3a2a1a' strokeWidth='5' strokeLinecap='round' />
        <path d='M40 52 L26 58' fill='none' stroke='url(#dp-steel)' strokeWidth='4' strokeLinecap='round' />
        <path d='M30 56 L22 60 L28 50 Z' fill='#1b1b20' />
        <rect
          x='36'
          y='64'
          width='56'
          height='56'
          rx='2'
          fill='url(#dp-ink-glass)'
          stroke='#05060a'
          strokeWidth='1.5'
        />
        <rect x='46' y='52' width='36' height='16' fill='#14161d' stroke='#05060a' strokeWidth='1.5' />
        <rect x='50' y='44' width='28' height='10' fill='#2a2118' />
        <path d='M42 72 L42 112' stroke='rgba(255,255,255,.28)' strokeWidth='3' strokeLinecap='round' />
        <ellipse cx='64' cy='122' rx='34' ry='4' fill='rgba(0,0,0,.35)' />
      </svg>
    </Prop>
  )
}

/** 一叠《奇案特刊》：最上面一份露出报头与头条。 */
export function NewsStack(props: { shown: boolean; className: string }) {
  const { t } = useTranslation()
  const zh = usePreferencesStore((state) => state.locale) === 'zh-CN'
  return (
    <Prop shown={props.shown} from='left' depth={0.9} tilt={-3} className={props.className}>
      <div className='relative aspect-[.82]'>
        {[
          { tint: '#d9c9a4', rotate: -3, inset: 'top-[3%] left-[-2%]' },
          { tint: '#e2d3ae', rotate: 2, inset: 'top-[1.5%] left-[1%]' },
        ].map((sheet) => (
          <Surface
            key={sheet.tint}
            texture='crumpled'
            tint={sheet.tint}
            aged={0.4}
            rough={false}
            className={cn('absolute! size-full', sheet.inset)}
            style={{ rotate: `${sheet.rotate}deg` }}
          />
        ))}
        <Surface texture='crumpled' tint='#e8dab8' aged={0.34} rough={false} className='absolute! size-full'>
          <span className='flex flex-col gap-[3cqw] px-[7cqw] pt-[8cqw] text-[#17120d] [filter:url(#dp-type)]'>
            <span
              className={cn(
                'text-center leading-none',
                zh ? 'font-serif-sc text-[12cqw] font-black tracking-[.24em]' : 'font-heading text-[8.4cqw] font-bold',
              )}
            >
              {t('dp.paper.masthead')}
            </span>
            <span className='block h-[4px] border-y border-[#17120d]' />
            <span className='font-serif-sc text-[8cqw] leading-[1.12] font-black text-balance'>
              {t('signal.title')}
            </span>
          </span>
        </Surface>
      </div>
    </Prop>
  )
}

export { DeskDefs }
