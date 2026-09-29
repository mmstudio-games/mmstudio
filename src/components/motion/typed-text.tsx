import { useEffect, useState } from 'react'

/** 打字机逐字出现的文字；active 为假时不开始。可见层对读屏隐藏，另有 sr-only 原文。 */
export function TypedText({
  text,
  active = true,
  speed = 28,
  caretClassName = 'text-[#842219]',
}: {
  text: string
  active?: boolean
  speed?: number
  caretClassName?: string
}) {
  const [count, setCount] = useState(0)
  const chars = Array.from(text)

  useEffect(() => {
    if (!active) {
      setCount(0)
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(chars.length)
      return
    }
    let index = 0
    const timer = window.setInterval(() => {
      index++
      setCount(index)
      if (index >= chars.length) window.clearInterval(timer)
    }, speed)
    return () => window.clearInterval(timer)
  }, [active, chars.length, speed])

  return (
    <>
      <span aria-hidden>
        {chars.slice(0, count).join('')}
        {active && count < chars.length ? <span className={`animate-blink ${caretClassName}`}>▌</span> : null}
      </span>
      <span className='sr-only'>{text}</span>
    </>
  )
}
