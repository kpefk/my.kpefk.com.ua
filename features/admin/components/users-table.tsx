'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, ShieldCheck, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { USER_ROLE_COLORS, USER_ROLE_LABELS } from '@/lib/types/user-role.types'

import { getUserDisplayName, type AdminUserDto } from '../types'

interface SortState {
  column: 'email' | 'role' | 'isActive' | 'createdAt' | null
  direction: 'asc' | 'desc'
}

interface UsersTableProps {
  users: AdminUserDto[]
  isLoading: boolean
  onRowClick: (u: AdminUserDto) => void
}

function SortIcon({ column, sort }: { column: SortState['column']; sort: SortState }) {
  if (sort.column !== column) return null
  return sort.direction === 'asc'
    ? <ChevronUp size={14} className="inline ml-1" />
    : <ChevronDown size={14} className="inline ml-1" />
}

function sortUsers(users: AdminUserDto[], sort: SortState): AdminUserDto[] {
  if (!sort.column) return users
  return [...users].sort((a, b) => {
    let aVal: string | boolean
    let bVal: string | boolean
    switch (sort.column) {
      case 'email':    aVal = a.email.toLowerCase();  bVal = b.email.toLowerCase();  break
      case 'role':     aVal = a.role.toLowerCase();   bVal = b.role.toLowerCase();   break
      case 'isActive': aVal = a.isActive;             bVal = b.isActive;             break
      case 'createdAt':aVal = a.createdAt;            bVal = b.createdAt;            break
      default: return 0
    }
    if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1
    return 0
  })
}

const SKELETON_ROWS = 8

export function UsersTable({ users, isLoading, onRowClick }: UsersTableProps) {
  const [sort, setSort] = useState<SortState>({ column: 'createdAt', direction: 'desc' })

  const handleSort = (column: SortState['column']) =>
    setSort((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' }
    )

  const sorted = sortUsers(users, sort)

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="cursor-pointer select-none" onClick={() => handleSort('email')}>
              Email <SortIcon column="email" sort={sort} />
            </TableHead>
            <TableHead className="hidden md:table-cell">ПІБ</TableHead>
            <TableHead className="cursor-pointer select-none hidden sm:table-cell" onClick={() => handleSort('role')}>
              Роль <SortIcon column="role" sort={sort} />
            </TableHead>
            <TableHead className="hidden lg:table-cell">Група / Посада</TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => handleSort('isActive')}>
              Статус <SortIcon column="isActive" sort={sort} />
            </TableHead>
            <TableHead className="text-center">2FA</TableHead>
            <TableHead className="cursor-pointer select-none hidden lg:table-cell" onClick={() => handleSort('createdAt')}>
              Зареєстровано <SortIcon column="createdAt" sort={sort} />
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading && Array.from({ length: SKELETON_ROWS }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-44" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-36" /></TableCell>
              <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
              <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
              <TableCell className="text-center"><Skeleton className="h-4 w-4 mx-auto rounded-full" /></TableCell>
              <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
            </TableRow>
          ))}

          {!isLoading && sorted.length === 0 && (
            <TableRow>
              <TableCell colSpan={7}>
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <Users size={48} className="text-muted-foreground/40" />
                  <p className="font-semibold">Користувачів не знайдено</p>
                  <p className="text-sm text-muted-foreground">Спробуйте змінити параметри пошуку</p>
                </div>
              </TableCell>
            </TableRow>
          )}

          {!isLoading && sorted.map((user) => (
            <TableRow
              key={user.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onRowClick(user)}
            >
              <TableCell className="font-medium font-mono text-sm">{user.email}</TableCell>
              <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                {getUserDisplayName(user) === user.email ? '—' : getUserDisplayName(user)}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge className={`${USER_ROLE_COLORS[user.role]} hover:${USER_ROLE_COLORS[user.role]} whitespace-nowrap`}>
                  {USER_ROLE_LABELS[user.role]}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm hidden lg:table-cell">
                {user.student?.groupName ?? user.teacher?.positionName ?? '—'}
              </TableCell>
              <TableCell>
                {user.isActive ? (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100">
                    Активний
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100">
                    Деактивований
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-center">
                {user.isTwoFactorEnabled
                  ? <ShieldCheck size={16} className="inline text-emerald-500" />
                  : <span className="text-muted-foreground/40 text-xs">—</span>
                }
              </TableCell>
              <TableCell className="text-muted-foreground text-sm hidden lg:table-cell">
                {new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(user.createdAt))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
