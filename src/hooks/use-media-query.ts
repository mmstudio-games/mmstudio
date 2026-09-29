import { useSyncExternalStore } from 'react'

export const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'
export const FINE_POINTER = '(hover: hover) and (pointer: fine)'

export function matches(query: string) {
  return typeof window !== 'undefined' && window.matchMedia(query).matches
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

export const useReducedMotion = () => useMediaQuery(REDUCED_MOTION)
export const useFinePointer = () => useMediaQuery(FINE_POINTER)
