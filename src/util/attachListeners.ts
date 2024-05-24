import { JSX } from 'alien-dom'

/**
 * Attach event listeners to an element, then return a function that removes them.
 */
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
