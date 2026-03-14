import type { ReactNode } from 'react'
import { cn } from '../ui/classNames'

export const PageIntro = ({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}) => (
  <section className="flex flex-col gap-6 rounded-3xl border border-white bg-white/90 p-8 shadow-sm shadow-brand-100/40 ring-1 ring-slate-100 lg:flex-row lg:items-end lg:justify-between">
    <div className="max-w-3xl space-y-3">
      {eyebrow ? (
        <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
          {eyebrow}
        </div>
      ) : null}
      <div className="space-y-2">
        <h1 className="font-serif text-3xl tracking-tight text-slate-950 sm:text-4xl">
          {title}
        </h1>
        <p className="text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
      </div>
    </div>
    {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
  </section>
)

export const SurfaceCard = ({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) => (
  <section
    className={cn(
      'rounded-3xl border border-slate-200/80 bg-white/92 p-6 shadow-sm shadow-slate-200/70 ring-1 ring-white',
      className
    )}
  >
    {children}
  </section>
)

export const SectionHeading = ({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div className="space-y-1">
      <h2 className="font-serif text-2xl tracking-tight text-slate-950">{title}</h2>
      {description ? <p className="text-sm text-slate-600">{description}</p> : null}
    </div>
    {action}
  </div>
)

export const StatCard = ({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) => (
  <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
      {label}
    </div>
    <div className="mt-3 font-serif text-3xl text-slate-950">{value}</div>
    <div className="mt-2 text-sm leading-6 text-slate-600">{detail}</div>
  </div>
)
