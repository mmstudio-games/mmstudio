/** 预加载结束的一次性信号。首屏入场动画等它结束后再播放。 */
let done = false
const listeners = new Set<() => void>()

export function markIntroDone() {
  if (done) return
  done = true
  for (const listener of listeners) listener()
  listeners.clear()
}

/** 预加载已结束时立即回调；否则等结束时回调。返回取消订阅函数。 */
export function onIntroDone(listener: () => void) {
  if (done) {
    listener()
    return () => {}
  }
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
