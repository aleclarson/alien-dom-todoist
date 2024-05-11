import { JSX } from 'alien-dom'

const ActionButtonTheme = {
  red: 'color-white bg-#de4c4a hover:bg-#e36564',
  gray: 'color-#e4e4e4 bg-#292929 hover:bg-#3d3d3d',
}

type ForwardedProps = Omit<JSX.IntrinsicElements['div'], 'color'>

/**
 * This component provides common styles for action buttons.
 */
export function ActionButton({
  color,
  ...props
}: ForwardedProps & {
  /** @default "gray" */
  color?: keyof typeof ActionButtonTheme
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      {...props}
      class={[
        'flex-row items-center h-2.46 text-13 px-0.92 rounded-5px font-600 transition-all cursor-pointer',
        ActionButtonTheme[color ?? 'gray'],
        props.class,
      ]}
    />
  )
}
