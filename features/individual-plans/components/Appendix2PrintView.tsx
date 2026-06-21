'use client'

import { Printer } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { Appendix2Data } from '../types'

interface Appendix2PrintViewProps {
  data: Appendix2Data
}

export function Appendix2PrintView({ data }: Appendix2PrintViewProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between print:hidden">
        <h2 className="text-lg font-semibold">
          Додаток 2 — Заява на вибір ВК
        </h2>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Друк
        </Button>
      </div>

      <div className="mx-auto max-w-2xl print:max-w-none print:text-sm">
        <div className="mb-6 text-right print:mb-4">
          <p>Заступнику директора з навчальної роботи</p>
          <p>КПЕФК ЛНТУ</p>
          <p className="mt-2">
            студента(ки) групи {data.student.group}
          </p>
          <p className="font-semibold">{data.student.fullName}</p>
        </div>

        <div className="mb-6 text-center print:mb-4">
          <p className="text-xl font-bold print:text-lg">ЗАЯВА</p>
        </div>

        <div className="mb-6 space-y-2 print:mb-4">
          <p>
            Прошу зарахувати мене на вивчення вибіркової навчальної компоненти
            на {data.academicYear} навчальний рік:
          </p>
          <p className="font-medium">
            Блок: «{data.block.name}» ({data.block.semester} семестр)
          </p>
        </div>

        <div className="mb-6 space-y-2 print:mb-4">
          <p className="font-medium">Доступні варіанти:</p>
          <div className="space-y-1 pl-4">
            {data.offerings.map((o, i) => (
              <div key={o.componentId} className="flex items-start gap-2">
                <span className="text-muted-foreground print:text-black">
                  {i + 1}.
                </span>
                <div>
                  <span className={
                    data.currentSelection?.componentId === o.componentId
                      ? 'font-bold underline'
                      : ''
                  }>
                    {o.code && <span className="text-muted-foreground mr-1 print:text-black">{o.code}</span>}
                    {o.name}
                  </span>
                  <span className="text-muted-foreground ml-2 print:text-black">
                    ({o.ects} кредитів ЄКТС)
                  </span>
                  {o.isHigherEd && (
                    <span className="text-amber-600 ml-2 text-xs">
                      [вищої освіти]
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {data.currentSelection && (
          <div className="mb-6 rounded border bg-green-50 p-3 dark:bg-green-950 print:mb-4 print:bg-white">
            <p>
              Обраний компонент:{' '}
              <strong>
                {data.offerings.find(
                  (o) => o.componentId === data.currentSelection?.componentId,
                )?.name ?? '—'}
              </strong>
            </p>
          </div>
        )}

        <div className="mt-8 flex justify-between print:mt-12">
          <div>
            <p>Дата: _______________</p>
          </div>
          <div>
            <p>Підпис: _______________</p>
          </div>
        </div>

        <div className="text-muted-foreground mt-6 text-xs print:text-black">
          <p>
            Відповідно до §3.4 Положення про порядок вибору вибіркових
            навчальних компонент КПЕФК ЛНТУ (наказ №42-од від 01.09.2022).
          </p>
        </div>
      </div>
    </div>
  )
}
