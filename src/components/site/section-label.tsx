import { ScrambleText } from '@/components/motion/scramble-text'
import { cn } from '@/lib/utils'

/** 区块抬头：编号 + 标签 + 细线，编号与标签进入视口时解码。 */
export function SectionLabel({ index, label, className }: { index: string; label: string; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 font-mono text-[.66rem] tracking-[.2em] text-muted-foreground uppercase',
        className,
      )}
    >
      <ScrambleText text={`(${index})`} className='text-accent' />
      <ScrambleText text={label} />
      <span aria-hidden className='h-px flex-1 bg-border' />
    </div>
  )
}
