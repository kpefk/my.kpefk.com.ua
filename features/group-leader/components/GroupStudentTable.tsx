'use client'

import { useState, useMemo } from 'react'
import { Check, Minus, ChevronRight, Download } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ENDPOINTS } from '@/lib/api/endpoints'
import { api } from '@/lib/api/client'

import type { GroupStudentDto } from '../types'
import { StudentDetailPanel } from './StudentDetailPanel'

interface GroupStudentTableProps {
  groupId: string
  groupName: string
  students: GroupStudentDto[]
}

export function GroupStudentTable({ groupId, groupName, students }: GroupStudentTableProps) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<GroupStudentDto | null>(null)
  const [exporting, setExporting] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return students
    return students.filter((s) => s.fullName.toLowerCase().includes(q))
  }, [students, search])

  const filledCount = students.filter((s) => s.hasParentInfo).length

  async function handleExport() {
    setExporting(true)
    try {
      const resp = await api.get(ENDPOINTS.GROUP_LEADER.EXPORT(groupId), {
        responseType: 'blob',
      })
      const url = URL.createObjectURL(resp.data as Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${groupName}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Input
            placeholder="Пошук за ПІБ…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Батьки заповнено:{' '}
            <span className="font-medium text-foreground">
              {filledCount} / {students.length}
            </span>
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
          <Download size={14} className="mr-1.5" />
          {exporting ? 'Завантаження…' : 'Експорт Excel'}
        </Button>
      </div>

      <div className="rounded-md border mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">№</TableHead>
              <TableHead>ПІБ</TableHead>
              <TableHead className="hidden sm:table-cell">Дата нар.</TableHead>
              <TableHead className="hidden md:table-cell">Корп. пошта</TableHead>
              <TableHead className="text-center">Батьки</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Студентів не знайдено
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s, i) => (
                <TableRow
                  key={s.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelected(s)}
                >
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{s.fullName}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                    {s.birthday
                      ? new Date(s.birthday).toLocaleDateString('uk-UA')
                      : '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {s.email ?? '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    {s.hasParentInfo ? (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 gap-1">
                        <Check size={11} />
                        Заповнено
                      </Badge>
                    ) : (
                      <Minus size={14} className="mx-auto text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <StudentDetailPanel
        student={selected}
        groupId={groupId}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </>
  )
}
