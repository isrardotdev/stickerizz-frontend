import type { ButtonHTMLAttributes, ElementType, ReactNode } from 'react'
import { cn } from './classNames'

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  align?: 'start' | 'center'
  tone?: 'dark' | 'light'
  as?: ElementType
  children: ReactNode
}

const baseClasses =
  'inline-flex items-center justify-center rounded-full border text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50'

const variantClasses = {
  dark: {
    primary: 'border-brand-600 bg-brand-600 text-white shadow-sm shadow-brand-900/20 hover:bg-brand-700',
    outline: 'border-slate-700 bg-slate-900 text-slate-100 hover:border-slate-600 hover:bg-slate-800',
    ghost: 'border-transparent bg-transparent text-slate-200 hover:bg-slate-800',
    danger: 'border-red-500 bg-red-600 text-slate-50 hover:bg-red-700',
  },
  light: {
    primary: 'border-brand-700 bg-brand-700 text-white shadow-sm shadow-brand-900/20 hover:bg-brand-800',
    outline: 'border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50',
    ghost: 'border-transparent bg-transparent text-slate-700 hover:bg-brand-50',
    danger: 'border-red-600 bg-red-600 text-white hover:bg-red-700',
  },
} satisfies Record<'dark' | 'light', Record<ButtonVariant, string>>

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-4 py-2.5 text-sm',
}

export const buttonClassName = ({
  variant = 'outline',
  size = 'md',
  align = 'center',
  tone = 'dark',
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  align?: 'start' | 'center'
  tone?: 'dark' | 'light'
  className?: string
}) =>
  cn(
    baseClasses,
    variantClasses[tone][variant],
    sizeClasses[size],
    align === 'start' ? 'justify-start text-left' : null,
    className
  )

const Button = ({
  variant = 'outline',
  size = 'md',
  align = 'center',
  tone = 'dark',
  as: Component = 'button',
  className,
  children,
  ...props
}: ButtonProps) => {
  return (
    <Component
      className={buttonClassName({ variant, size, align, tone, className })}
      {...props}
    >
      {children}
    </Component>
  )
}

export default Button
