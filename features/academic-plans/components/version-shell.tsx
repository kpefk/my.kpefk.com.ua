'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, BookText, CalendarDays, GitBranch, Layers } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import { formatDate, type CurriculumVersionDetailDto } from '../types'

interface VersionShellProps {
  curriculumId: string
  versionId: string
  version: CurriculumVersionDetailDto | undefined
  isLoading: boolean
  children: React.ReactNode
}

const TABS = [
  { label: 'Структура', icon: Layers, segment: 'structure' },
  { label: 'Групи', icon: GitBranch, segment: 'groups' },
  { label: 'Робочий план', icon: CalendarDays, segment: 'working' },
] as const

export function VersionShell({
  curriculumId,
  versionId,
  version,
  isLoading,
  children,
}: VersionShellProps) {
  const pathname = usePathname()
  const base = `/academic-plans/${curriculumId}/versions/${versionId}`

  return (
    <div className="flex flex-col gap-0">
      {/* Back link */}
      <div className="px-4 sm:px-6 pt-4 pb-2">
        <Link
          href={`/academic-plans/${curriculumId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          До навчального плану
        </Link>
      </div>

      {/* Version header */}
      <div className="px-4 sm:px-6 py-3 border-b border-border bg-card">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
        ) : version ? (
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <BookText size={18} className="text-muted-foreground shrink-0" />
              <span className="font-semibold">
                {version.curriculum?.program?.name ?? '—'} — версія v{version.versionNumber}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {/* Status badge */}
              {version.isPublished && !version.deprecatedAt && (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">
                  Опублікований
                </Badge>
              )}
              {version.isPublished && version.deprecatedAt && (
                <Badge variant="outline" className="text-muted-foreground text-xs">
                  Застарілий
                </Badge>
              )}
              {!version.isPublished && (
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                  Чернетка
                </Badge>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Tab navigation */}
      <div className="px-4 sm:px-6 border-b border-border bg-card">
        <nav className="flex gap-0 -mb-px">
          {TABS.map(({ label, icon: Icon, segment }) => {
            const href = `${base}/${segment}`
            const isActive = pathname.startsWith(href)
            return (
              <Link
                key={segment}
                href={href}
                className={cn(
                  'inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
                )}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Page content */}
      <div className="flex-1">{children}</div>
    </div>
  )
}
