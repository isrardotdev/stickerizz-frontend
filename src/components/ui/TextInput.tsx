import type { InputHTMLAttributes } from 'react'
import { cn } from './classNames'

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  tone?: 'dark' | 'light'
}

const toneClasses = {
  dark:
    'border-slate-700 bg-slate-900 text-slate-200 placeholder:text-slate-500 focus:outline-brand-500',
  light:
    'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-brand-500',
} as const

const TextInput = ({
  className,
  tone = 'dark',
  ...props
}: TextInputProps) => {
  return (
    <input
      className={cn(
        'w-full rounded-2xl border px-3 py-2 text-sm focus:outline focus:outline-2 focus:outline-offset-0',
        toneClasses[tone],
        className
      )}
      {...props}
    />
  )
}

export default TextInput
