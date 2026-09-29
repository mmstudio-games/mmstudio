import { type RefObject, useEffect, useState } from 'react'

/** 元素首次进入视口后返回 true，之后保持不变。 */
export function useInView(ref: RefObject<Element | null>, rootMargin = '0px 0px -20% 0px') {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || inView) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, rootMargin, inView])

  return inView
}
