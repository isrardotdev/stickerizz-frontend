import type { InputHTMLAttributes } from 'react'
import { cn } from './classNames'

type TextInputProps = InputHTMLAttributes<HTMLInputElement>

const TextInput = ({ className, ...props }: TextInputProps) => {
  return (
    <input
      className={cn(
        'w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-200 focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-blue-500',
        className
      )}
      {...props}
    />
  )
}

export default TextInput
