import { JSX } from 'alien-dom'

export function attachListeners(
  target: JSX.Element,
  listeners: {
    [K in keyof HTMLElementEventMap]?: {
      (event: HTMLElementEventMap[K]): void
    }
  }
) {
  for (const key in listeners) {
    target.addEventListener(key, (listeners as any)[key])
  }
  return () => {
    for (const key in listeners) {
      target.removeEventListener(key, (listeners as any)[key])
    }
  }
}
