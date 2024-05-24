import { attachListeners } from '@/util/attachListeners'
import { EffectContext, JSX, ReadonlyRef, useEffect, useRef } from 'alien-dom'

const states = {
  hover: { mouseenter: true, mouseleave: false },
  click: { mousedown: true, mouseup: false },
  focus: { focusin: true, focusout: false },
}

/**
 * Observe the hover, click, or focus state of the component's root element or a given `target`
 * element.
 */
export function useEventState(
  state: keyof typeof states,
  target?: JSX.Element
): ReadonlyRef<boolean> & [value: boolean] {
  const ref = useRef(false)
  useEffect(
    ({ rootElement }: EffectContext) => {
      target ||= rootElement

      const listeners: any = {}
      for (const [key, value] of Object.entries(states[state])) {
        listeners[key] = () => {
          ref.value = value
        }
      }

      return attachListeners(target, listeners)
    },
    [target]
  )
  return ref as any
}
