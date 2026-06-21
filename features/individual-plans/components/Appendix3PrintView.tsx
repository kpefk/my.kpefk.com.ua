'use client'

import { Printer } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import type { Appendix3Data } from '../types'

interface Appendix3PrintViewProps {
  data: Appendix3Data
}

export function Appendix3PrintView({ data }: Appendix3PrintViewProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between print:hidden">
        <h2 className="text-lg font-semibold">{data.title}</h2>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Друк
        </Button>
      </div>

      <div className="print:block print:text-sm">
        <div className="mb-4 text-center print:mb-2">
          <p className="text-lg font-bold print:text-base">
            Додаток 3
          </p>
          <p className="text-muted-foreground print:text-black">
            Список студентів групи {data.group}, зарахованих на вибіркову компоненту
          </p>
          <p className="text-muted-foreground print:text-black">
            «{data.block}» ({data.semester} семестр, {data.academicYear} н.р.)
          </p>
        </div>

        <div className="rounded-md border print:border-black">
          <Table>
            <TableHeader>
              <TableRow className="print:border-black">
                <TableHead className="w-12 print:border-black print:text-black">
                  №
                </TableHead>
                <TableHead className="print:border-black print:text-black">
                  Прізвище, ім'я, по батькові
                </TableHead>
                <TableHead className="print:border-black print:text-black">
                  Назва ВК
                </TableHead>
                <TableHead className="w-36 print:border-black print:text-black">
                  Спосіб вибору ВК
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row) => (
                <TableRow key={row.no} className="print:border-black">
                  <TableCell className="print:border-black">{row.no}</TableCell>
                  <TableCell className="print:border-black">{row.fullName}</TableCell>
                  <TableCell className="print:border-black">
                    {row.componentCode && (
                      <span className="text-muted-foreground mr-1 print:text-black">
                        {row.componentCode}
                      </span>
                    )}
                    {row.componentName}
                  </TableCell>
                  <TableCell className="text-center print:border-black">
                    {row.methodLabel}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="text-muted-foreground mt-4 text-sm print:text-black">
          <p>Всього студентів: {data.totalStudents}</p>
          <p>За заявою: {data.voluntaryCount}</p>
          <p>За наказом: {data.assignedCount}</p>
        </div>

        <div className="mt-8 flex justify-between print:mt-12">
          <div>
            <p className="text-muted-foreground text-sm print:text-black">
              Заступник директора з навчальної роботи
            </p>
            <div className="mt-8 border-b border-black w-48" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm print:text-black">
              Дата: _______________
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
