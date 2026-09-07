'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Плитка з ключовим показником. */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  isLoading,
  accent,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon?: React.ElementType
  href?: string
  isLoading?: boolean
  accent?: string
}) {
  const body = (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-4 h-full flex flex-col gap-1',
        href && 'transition-colors hover:bg-accent/40'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
        {Icon && <Icon size={16} className={cn('shrink-0', accent ?? 'text-muted-foreground')} />}
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-16 mt-1" />
      ) : (
        <p className="text-2xl font-bold tabular-nums">{value}</p>
      )}
      {hint && !isLoading && (
        <p className="text-xs text-muted-foreground leading-tight">{hint}</p>
      )}
    </div>
  )

  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  )
}

/** Секція-картка з заголовком і опційним посиланням «усі». */
export function DashboardSection({
  title,
  description,
  href,
  hrefLabel = 'Перейти',
  children,
  className,
}: {
  title: string
  description?: string
  href?: string
  hrefLabel?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-2xl border border-border bg-card p-5', className)}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="text-xs text-primary hover:underline shrink-0 inline-flex items-center gap-1"
          >
            {hrefLabel}
            <ArrowRight size={12} />
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

/** Порожній стан усередині секції. */
export function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground py-6 text-center">{children}</p>
}

export interface QuickLink {
  href: string
  label: string
  icon: React.ElementType
}

/** Сітка швидких переходів. */
export function QuickLinks({ links }: { links: QuickLink[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm transition-colors hover:bg-accent/40"
        >
          <Icon size={16} className="text-muted-foreground shrink-0" />
          <span className="truncate">{label}</span>
        </Link>
      ))}
    </div>
  )
}
