import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Redacted } from '@/components/motion/redacted'
import { SectionLabel } from '@/components/site/section-label'
import { useReducedMotion } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { usePreferencesStore } from '@/stores/preferences-store'

type Token = { text: string; redacted: boolean; head: string; tail: string }

const OPENING = /^[「『《（“]$/
const CLOSING = /^[」』》）”。，、；：！？]$/

/**
 * 把带 [关键词] 标记的文案拆成逐字（中文）或逐词（英文）的片段。
 * 中文的开合标点并入相邻片段，避免标点单独折行。
 */
function tokenize(body: string, cjk: boolean): Token[] {
  const tokens: Token[] = []
  let head = ''
  const push = (text: string, redacted: boolean) => {
    tokens.push({ text, redacted, head, tail: '' })
    head = ''
  }
  for (const part of body.split(/(\[[^\]]+\])/)) {
    if (!part) continue
    if (part.startsWith('[')) {
      push(part.slice(1, -1), true)
      continue
    }
    for (const piece of cjk ? Array.from(part) : part.split(/(\s+)/)) {
      if (!piece) continue
      const last = tokens.at(-1)
      if (cjk && CLOSING.test(piece) && last) last.tail += piece
      else if (cjk && OPENING.test(piece)) head += piece
      else push(piece, false)
    }
  }
  return tokens
}

export function HomeManifesto() {
  const { t } = useTranslation()
  const locale = usePreferencesStore((state) => state.locale)
  const reduced = useReducedMotion()
  const root = useRef<HTMLElement>(null)
  const body = t('manifesto.body')
  const tokens = useMemo(() => tokenize(body, locale === 'zh-CN'), [body, locale])

  useGSAP(
    () => {
      const media = gsap.matchMedia()
      media.add('(prefers-reduced-motion: no-preference)', () => {
        const words = gsap.utils.toArray<HTMLElement>('[data-token]')
        const timeline = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
        })
        // 普通字词由暗转亮；关键词的机密条在读到时收起。
        words.forEach((word, index) => {
          const bar = word.querySelector('[data-redaction]')
          if (bar) timeline.fromTo(bar, { scaleX: 1 }, { scaleX: 0, duration: 5, ease: 'power2.inOut' }, index + 1)
          else timeline.fromTo(word, { opacity: 0.12 }, { opacity: 1, duration: 3, ease: 'none' }, index)
        })
        timeline.to({}, { duration: 4 })
      })
      return () => media.revert()
    },
    { scope: root, dependencies: [tokens], revertOnUpdate: true },
  )

  return (
    <section ref={root} className={cn('relative', reduced ? 'py-32' : 'h-[240svh]')}>
      <div
        className={cn(
          'flex flex-col justify-center gap-12 px-[clamp(1.25rem,4vw,4.5rem)]',
          !reduced && 'sticky top-0 h-svh',
        )}
      >
        <SectionLabel index='01' label={t('manifesto.label')} />
        <p
          className={cn(
            'max-w-[22em] text-[clamp(1.9rem,4.6vw,4.6rem)] leading-[1.28] tracking-[-.01em]',
            locale === 'zh-CN' ? 'font-serif-sc font-medium' : 'font-heading',
          )}
        >
          {tokens.map((token, index) =>
            /\S/.test(token.text) ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: 片段顺序固定
              <span key={index} className='whitespace-nowrap'>
                {token.head ? <span data-token>{token.head}</span> : null}
                {token.redacted ? (
                  <span data-token className='text-accent'>
                    <Redacted revealed={reduced ? true : undefined} barClassName='bg-foreground'>
                      {token.text}
                    </Redacted>
                  </span>
                ) : (
                  <span data-token>{token.text}</span>
                )}
                {token.tail ? <span data-token>{token.tail}</span> : null}
              </span>
            ) : (
              token.text
            ),
          )}
        </p>
      </div>
    </section>
  )
}
