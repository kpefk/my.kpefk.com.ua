"use client"

import { Calendar, Edit2 } from "lucide-react"
import { Button } from "../ui/button"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Label } from "../ui/label"
import { ButtonGroup } from "../ui/button-group"
import Link from "next/link"

export function AttendanceClient() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">

      {/* Заголовок */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Відвідуваність</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            17 Червень, Середа
          </p>
        </div>
      </div>

      {/* Empty state — немає занять сьогодні */}
      <div className="flex flex-col items-center justify-center h-full py-24 gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Calendar size={28} className="text-muted-foreground" />
        </div>
        <div className="space-y-1 max-w-xs">
          <p className="font-semibold text-foreground">Відвідуваність</p>
          <p className="text-sm text-muted-foreground">
            У Вас сьогодні немає занять. Або зверніться до адміністратора, якщо вважаєте, що це помилка.
          </p>
        </div>
      </div>

      {/*
        Якщо є заняття, показуємо кнопки з часом початку занять.
        Якщо попереднє заняття було у тієї ж групи, що і поточне,
        показуємо кнопку "Перенести відвідуваність",
        яка відкриває список студентів з попереднього заняття.
        Також показуємо рядок з темою заняття.
      */}

      <div>
        <ButtonGroup>
          <Button variant="outline">
            <Calendar /> 8:30 - 9:50
          </Button>
          <Button variant="outline">
            <Calendar /> 10:00 - 11:20
          </Button>
        </ButtonGroup>
      </div>

      <div className="flex flex-col gap-1 mt-2">
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">Предмет:</span>
            <span className="text-sm">Інформатика</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">Група:</span>
            <span className="text-sm">122 Д</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">Тема уроку:</span>
            <span className="text-sm">Знайомство з Python</span>
            <Button variant="ghost" size="icon" className="h-5 w-5 ml-0.5">
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>
      </div>

      {/*
        Коли викладач вибрав конкретне заняття, показуємо список студентів.
        Є 3 позначки відвідуваності: Відсутній, Присутній, Запізнився.
        За замовчуванням всі студенти позначені як Відсутні.
        Викладач може змінити статус кожного студента та зберегти результат.
        Також є поле з оцінкою та коментарем для кожного студента.
        Всі зміни зберігаються на сервері.
      */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>№</TableHead>
            <TableHead>Студент</TableHead>
            <TableHead>Присутність</TableHead>
            <TableHead>Оцінка</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>1</TableCell>
            <TableCell><Link href="/profile/{id}">Іваненко Іван Іванович</Link></TableCell>
            <TableCell>
                <div className="flex items-center gap-3">
                  <RadioGroup
                    defaultValue="present"
                    className="flex flex-row gap-3"
                  >
                    <RadioGroupItem
                      aria-label="Відсутній"
                      value="absent"
                      id="absent"
                      className="border-red-500 text-red-500 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                    />
                    <RadioGroupItem
                      aria-label="Запізнився"
                      value="late"
                      id="late"
                      className="border-orange-500 text-orange-500 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                    />
                    <RadioGroupItem
                      aria-label="Присутній"
                      value="present"
                      id="present"
                      className="border-green-500 text-green-500 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    />
                  </RadioGroup>
                </div>
            </TableCell>
            <TableCell>
              <input type="text" className="border rounded px-2 py-1 w-16" placeholder="Оцінка" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

    </div>
  )
}