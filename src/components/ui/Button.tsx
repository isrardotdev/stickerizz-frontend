import type { ButtonHTMLAttributes, ElementType, ReactNode } from 'react'
import { cn } from './classNames'

type ButtonVariant = 'primary' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  align?: 'start' | 'center'
  as?: ElementType
  children: ReactNode
}

const baseClasses =
  'inline-flex items-center justify-center rounded-lg border text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'border-blue-500 bg-blue-600 text-slate-50 hover:bg-blue-700',
  outline: 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800',
  ghost: 'border-transparent bg-transparent text-slate-200 hover:bg-slate-800',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
}

export const buttonClassName = ({
  variant = 'outline',
  size = 'md',
  align = 'center',
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  align?: 'start' | 'center'
  className?: string
}) =>
  cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    align === 'start' ? 'justify-start text-left' : null,
    className
  )

const Button = ({
  variant = 'outline',
  size = 'md',
  align = 'center',
  as: Component = 'button',
  className,
  children,
  ...props
}: ButtonProps) => {
  return (
    <Component
      className={buttonClassName({ variant, size, align, className })}
      {...props}
    >
      {children}
    </Component>
  )
}

export default Button
