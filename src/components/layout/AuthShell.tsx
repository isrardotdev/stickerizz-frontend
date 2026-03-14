import type { ReactNode } from 'react'

type AuthShellProps = {
  eyebrow: string
  title: string
  description?: string
  children: ReactNode
  footer: ReactNode
}

const AuthShell = ({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthShellProps) => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(133,57,239,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.10),transparent_30%)]" />
      <div className="relative w-full max-w-lg">
        <section className="rounded-3xl border border-white bg-white/94 p-7 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 sm:p-8 lg:p-9">
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
            {eyebrow}
          </div>
          <h1 className="mt-3 font-serif text-4xl tracking-tight text-slate-950">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          ) : null}

          <div className="mt-7">{children}</div>
          <div className="mt-6 text-sm text-slate-600">{footer}</div>
        </section>
      </div>
    </div>
  )
}

export default AuthShell
