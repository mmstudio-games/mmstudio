import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * 机密条：用当前文字颜色的色块盖住内容，revealed 为真时色块向右收起。
 * 不传 revealed 时由外部动画控制 `[data-redaction]` 元素。
 */
export function Redacted({
  children,
  revealed,
  delay = 0,
  className,
  barClassName,
}: {
  children: ReactNode
  revealed?: boolean
  delay?: number
  className?: string
  barClassName?: string
}) {
  return (
    <span className={cn('relative inline-block', className)}>
      {children}
      <span
        aria-hidden
        data-redaction
        className={cn(
          'absolute -inset-x-[.08em] inset-y-[.06em] origin-right bg-current',
          revealed !== undefined && 'transition-transform duration-900 ease-in-out-quart',
          revealed && 'scale-x-0',
          barClassName,
        )}
        style={revealed !== undefined ? { transitionDelay: `${delay}ms` } : undefined}
      />
    </span>
  )
}
