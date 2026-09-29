import { cn } from '@/lib/utils'

/** 悬停时逐字上滚替换的文字。父元素需带 `group/roll`。 */
export function RollText({ text, className }: { text: string; className?: string }) {
  const chars = Array.from(text)

  return (
    <span className={cn('relative inline-flex overflow-hidden', className)}>
      <span className='sr-only'>{text}</span>
      <span aria-hidden className='flex'>
        {chars.map((char, index) => {
          const glyph = char === ' ' ? ' ' : char
          return (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: 字符位置即身份，文字变化时整体重建
              key={index}
              className='relative inline-block transition-transform duration-500 ease-out-expo group-hover/roll:-translate-y-full group-focus-visible/roll:-translate-y-full'
              style={{ transitionDelay: `${index * 16}ms` }}
            >
              <span className='block'>{glyph}</span>
              <span className='absolute top-full left-0 block'>{glyph}</span>
            </span>
          )
        })}
      </span>
    </span>
  )
}
