import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

export type Verdict = 'yes' | 'no' | 'irrelevant' | 'both'
/** 审定席上四块翻牌的顺序。 */
export const VERDICT_ORDER: readonly Verdict[] = ['yes', 'no', 'irrelevant', 'both']

/** 取一组文案（i18n 里的数组）。 */
export function useList(key: string) {
  const { t, i18n } = useTranslation()
  const language = i18n.language
  return useMemo(() => {
    void language
    const value = t(key, { returnObjects: true }) as unknown
    return Array.isArray(value) ? (value as string[]) : []
  }, [t, key, language])
}

/** 把「[关键字]」拆出来：关键字单独包一层，供折光镜底下圈注。 */
export function splitKeys(text: string) {
  return text.split(/(\[[^\]]+\])/).map((part) => ({
    key: part.startsWith('['),
    text: part.replace(/^\[|\]$/g, ''),
  }))
}

/** 1px 审定网格线。 */
export function PaperGrid({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        backgroundImage: dark
          ? 'linear-gradient(rgba(242,239,230,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(242,239,230,.06) 1px, transparent 1px)'
          : 'linear-gradient(rgba(13,11,9,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(13,11,9,.07) 1px, transparent 1px)',
        backgroundSize: 'clamp(48px, 6.25vw, 96px) clamp(48px, 6.25vw, 96px)',
        backgroundPosition: 'center center',
      }}
    />
  )
}

/** 难度星级：游戏站把难度分为简单、中等、困难三档。 */
export function Stars({ level, className }: { level: number | null; className?: string }) {
  return (
    <span aria-hidden className={cn('font-mono tracking-[.12em]', className)}>
      {level ? '★'.repeat(level) + '☆'.repeat(3 - level) : '？？？'}
    </span>
  )
}
