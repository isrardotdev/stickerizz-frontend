import clsx from 'clsx'

type ClassValue = string | false | null | undefined

export const cn = (...values: ClassValue[]) => clsx(values)
