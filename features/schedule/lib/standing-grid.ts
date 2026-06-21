// Експорт/друк розкладу у форматі сталої сітки як у файлі-зразку
// (День × Час × [Група: ОК | Ауд. | Викл.], чисельник/знаменник, «~ // ~» = щотижня).

import {
  BELL_TIMES,
  HOMEROOM_BELL,
  WORKING_DAYS,
  isVisibleOnParity,
  type ScheduleDto,
  type ScheduleEntryDto,
} from '../types'

const ALL_BELLS = [...BELL_TIMES, HOMEROOM_BELL]

const WEEKS = ['ODD', 'EVEN'] as const

interface GroupGrid {
  name: string
  map: Map<string, ScheduleEntryDto[]>
}

interface CellTriple {
  ok: string
  aud: string
  vykl: string
}

function buildGroupGrids(schedules: ScheduleDto[]): GroupGrid[] {
  return schedules.map((s) => {
    const map = new Map<string, ScheduleEntryDto[]>()
    for (const e of s.entries) {
      const key = `${e.dayOfWeek}:${e.slotNumber}`
      const arr = map.get(key) ?? []
      arr.push(e)
      map.set(key, arr)
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => (a.subgroupNumber ?? 0) - (b.subgroupNumber ?? 0))
    }
    return { name: s.groupName, map }
  })
}

/**
 * Вміст трьох клітинок (ОК/Ауд/Викл) для конкретного тижня:
 *   null     — порожньо;
 *   'repeat' — у знаменнику те саме, що щотижня → «~ // ~»;
 *   об'єкт   — конкретні заняття (рядки розділені \n для підгруп).
 */
function resolveCell(
  all: ScheduleEntryDto[],
  week: 'ODD' | 'EVEN',
): CellTriple | 'repeat' | null {
  const hasWeekSpecific = all.some((e) => e.weekParity !== 'EVERY')
  const every = all.filter((e) => e.weekParity === 'EVERY')

  if (week === 'EVEN' && !hasWeekSpecific) {
    return every.length > 0 ? 'repeat' : null
  }

  const entries = all.filter((e) => isVisibleOnParity(e.weekParity, week))
  if (entries.length === 0) return null

  const line = (e: ScheduleEntryDto, v: string) =>
    e.subgroupNumber ? `${e.subgroupNumber}пг ${v}` : v
  return {
    ok: entries.map((e) => line(e, e.subjectName)).join('\n'),
    aud: entries.map((e) => e.classroom?.number ?? '').join('\n'),
    vykl: entries.map((e) => e.teacher?.lastName ?? '').join('\n'),
  }
}

type Merge = { s: { r: number; c: number }; e: { r: number; c: number } }

// ─── XLSX export (зі стилями як в оригіналі) ─────────────────────────────────

interface BorderEdge {
  style: 'thin' | 'medium'
  color: { rgb: string }
}
interface XlsxStyle {
  font?: { name: string; sz: number; bold?: boolean }
  alignment?: {
    horizontal?: 'left' | 'center' | 'right'
    vertical?: 'top' | 'center' | 'bottom'
    wrapText?: boolean
    textRotation?: number
  }
  fill?: { patternType: 'solid'; fgColor: { rgb: string } }
  border?: { top: BorderEdge; bottom: BorderEdge; left: BorderEdge; right: BorderEdge }
}
interface StyledCell {
  t: 's'
  v: string
  s: XlsxStyle
}

const FONT = { name: 'Arial', sz: 9 }
const THIN: BorderEdge = { style: 'thin', color: { rgb: 'FF000000' } }
const ALL_BORDERS = { top: THIN, bottom: THIN, left: THIN, right: THIN }
const HEADER_FILL = { patternType: 'solid' as const, fgColor: { rgb: 'FFE7E6E6' } }

const ST = {
  title: {
    font: { ...FONT, sz: 12, bold: true },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: ALL_BORDERS,
  },
  header: {
    font: { ...FONT, bold: true },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    fill: HEADER_FILL,
    border: ALL_BORDERS,
  },
  day: {
    font: { ...FONT, bold: true },
    alignment: { horizontal: 'center', vertical: 'center', textRotation: 90 },
    fill: HEADER_FILL,
    border: ALL_BORDERS,
  },
  time: {
    font: FONT,
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: ALL_BORDERS,
  },
  subject: {
    font: FONT,
    alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
    border: ALL_BORDERS,
  },
  meta: {
    font: FONT,
    alignment: { horizontal: 'center', vertical: 'top', wrapText: true },
    border: ALL_BORDERS,
  },
  repeat: {
    font: FONT,
    alignment: { horizontal: 'center', vertical: 'center' },
    border: ALL_BORDERS,
  },
} satisfies Record<string, XlsxStyle>

export async function exportStandingXlsx(
  schedules: ScheduleDto[],
  fileName: string,
  sheetName: string,
  title: string,
): Promise<void> {
  const XLSX = await import('xlsx-js-style')
  const groups = buildGroupGrids(schedules)

  const TITLE = 1
  const HEADER = 2
  const DATA = TITLE + HEADER
  const perDay = ALL_BELLS.length * 2
  const totalRows = DATA + WORKING_DAYS.length * perDay
  const totalCols = 2 + groups.length * 3

  const aoa: string[][] = Array.from({ length: totalRows }, () =>
    Array<string>(totalCols).fill(''),
  )
  const merges: Merge[] = []

  // Заголовок-банер
  aoa[0]![0] = title
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } })

  // Шапка: День / Час / групи (ОК | Ауд. | Викл.)
  aoa[TITLE]![0] = 'День'
  aoa[TITLE]![1] = 'Час'
  merges.push({ s: { r: TITLE, c: 0 }, e: { r: TITLE + 1, c: 0 } })
  merges.push({ s: { r: TITLE, c: 1 }, e: { r: TITLE + 1, c: 1 } })
  groups.forEach((g, gi) => {
    const c = 2 + gi * 3
    aoa[TITLE]![c] = g.name
    merges.push({ s: { r: TITLE, c }, e: { r: TITLE, c: c + 2 } })
    aoa[TITLE + 1]![c] = 'ОК'
    aoa[TITLE + 1]![c + 1] = 'Ауд.'
    aoa[TITLE + 1]![c + 2] = 'Викл.'
  })

  // Тіло
  WORKING_DAYS.forEach((day, di) => {
    const dayStart = DATA + di * perDay
    aoa[dayStart]![0] = day.long
    merges.push({ s: { r: dayStart, c: 0 }, e: { r: dayStart + perDay - 1, c: 0 } })

    ALL_BELLS.forEach((bell, bi) => {
      const pairStart = dayStart + bi * 2
      aoa[pairStart]![1] = bell.slot <= 4 ? `${bell.start} - ${bell.end}` : `Вих. ${bell.start}`
      merges.push({ s: { r: pairStart, c: 1 }, e: { r: pairStart + 1, c: 1 } })

      WEEKS.forEach((week, wi) => {
        const r = pairStart + wi
        groups.forEach((g, gi) => {
          const c = 2 + gi * 3
          const cell = resolveCell(g.map.get(`${day.day}:${bell.slot}`) ?? [], week)
          if (cell === 'repeat') {
            aoa[r]![c] = '~ // ~'
          } else if (cell) {
            aoa[r]![c] = cell.ok
            aoa[r]![c + 1] = cell.aud
            aoa[r]![c + 2] = cell.vykl
          }
        })
      })
    })
  })

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!merges'] = merges
  ws['!cols'] = [
    { wch: 4 },
    { wch: 11 },
    ...groups.flatMap(() => [{ wch: 15 }, { wch: 5 }, { wch: 11 }]),
  ]

  // Стилі — рамки на кожній клітинці (щоб об'єднані теж мали повний контур).
  const styleFor = (r: number, c: number, value: string): XlsxStyle => {
    if (r === 0) return ST.title
    if (r === TITLE || r === TITLE + 1) return ST.header
    if (c === 0) return ST.day
    if (c === 1) return ST.time
    if (value === '~ // ~') return ST.repeat
    return (c - 2) % 3 === 0 ? ST.subject : ST.meta
  }

  for (let r = 0; r < totalRows; r++) {
    for (let c = 0; c < totalCols; c++) {
      const addr = XLSX.utils.encode_cell({ r, c })
      const value = aoa[r]![c] ?? ''
      const styled: StyledCell = { t: 's', v: value, s: styleFor(r, c, value) }
      ;(ws as Record<string, unknown>)[addr] = styled
    }
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31))
  XLSX.writeFile(wb, fileName)
}

// ─── Print (нове вікно з тією ж сіткою) ──────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function nl(s: string): string {
  return esc(s).replace(/\n/g, '<br>')
}

export function printStanding(schedules: ScheduleDto[], title: string): void {
  const groups = buildGroupGrids(schedules)

  let thead = `<tr><th rowspan="2">День</th><th rowspan="2">Час</th>${groups
    .map((g) => `<th colspan="3">${esc(g.name)}</th>`)
    .join('')}</tr>`
  thead += `<tr>${groups.map(() => '<th>ОК</th><th>Ауд.</th><th>Викл.</th>').join('')}</tr>`

  let tbody = ''
  WORKING_DAYS.forEach((day) => {
    ALL_BELLS.forEach((bell, bi) => {
      WEEKS.forEach((week, wi) => {
        tbody += '<tr>'
        if (bi === 0 && wi === 0) {
          tbody += `<td rowspan="${ALL_BELLS.length * 2}" class="day">${esc(day.long)}</td>`
        }
        if (wi === 0) {
          const timeLabel = bell.slot <= 4 ? `${bell.start}<br>${bell.end}` : `Вих.<br>${bell.start}`
          tbody += `<td rowspan="2" class="time">${timeLabel}</td>`
        }
        groups.forEach((g) => {
          const cell = resolveCell(g.map.get(`${day.day}:${bell.slot}`) ?? [], week)
          if (cell === 'repeat') {
            tbody += '<td class="rep">//</td><td></td><td></td>'
          } else if (cell) {
            tbody += `<td class="ok">${nl(cell.ok)}</td><td>${nl(cell.aud)}</td><td>${nl(cell.vykl)}</td>`
          } else {
            tbody += '<td></td><td></td><td></td>'
          }
        })
        tbody += '</tr>'
      })
    })
  })

  const html = `<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  @page { size: A4 landscape; margin: 8mm; }
  body { font-family: Arial, sans-serif; color:#000; }
  h2 { text-align:center; font-size:14px; margin:0 0 8px; }
  table { border-collapse: collapse; width:100%; font-size:9px; table-layout:fixed; }
  th, td { border:1px solid #000; padding:2px 3px; text-align:center; vertical-align:top; }
  th { background:#eee; }
  td.ok { text-align:left; }
  .day { font-weight:bold; writing-mode:vertical-rl; transform:rotate(180deg); white-space:nowrap; }
  .time { white-space:nowrap; }
  .rep { color:#666; }
</style></head>
<body><h2>${esc(title)}</h2><table><thead>${thead}</thead><tbody>${tbody}</tbody></table>
<script>window.onload=function(){window.focus();window.print();}</script>
</body></html>`

  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html)
  w.document.close()
}
