import type { ButtonHTMLAttributes } from 'react'
import { cn } from './classNames'

type ChipButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isActive?: boolean
}

const ChipButton = ({ isActive = false, className, ...props }: ChipButtonProps) => {
  return (
    <button
      type="button"
      className={cn(
        'rounded-full border px-2.5 py-1 text-xs transition-colors',
        isActive
          ? 'border-blue-500 bg-blue-500/15 text-slate-100'
          : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-blue-500 hover:text-slate-100',
        className
      )}
      {...props}
    />
  )
}

export default ChipButton
