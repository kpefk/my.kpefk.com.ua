import type { ScheduleEvent, GradesSummary, Announcement, Assignment, Grade } from '@/lib/types'

const today = new Date()

export const mockTodaySchedule: ScheduleEvent[] = [
  {
    id: '1',
    subject: 'Алгоритми та структури даних',
    teacher: 'Коваленко О. В.',
    room: '214',
    startTime: '08:00',
    endTime: '09:20',
    type: 'lecture',
    date: today,
    lessonNumber: 1,
  },
  {
    id: '2',
    subject: 'Веб-технології',
    teacher: 'Петренко С. М.',
    room: '108',
    startTime: '09:35',
    endTime: '10:55',
    type: 'lab',
    date: today,
    lessonNumber: 2,
  },
  {
    id: '3',
    subject: 'Бази даних',
    teacher: 'Іваненко Т. Р.',
    room: '312',
    startTime: '11:10',
    endTime: '12:30',
    type: 'practice',
    date: today,
    lessonNumber: 3,
  },
]

export const mockGradesSummary: GradesSummary = {
  average: 4.2,
  totalSubjects: 6,
  subjects: [
    { name: 'Алгоритми та структури даних', average: 4.5, grades: [] },
    { name: 'Веб-технології', average: 4.8, grades: [] },
    { name: 'Бази даних', average: 3.9, grades: [] },
    { name: 'Математика', average: 4.1, grades: [] },
    { name: 'Системне програмування', average: 3.7, grades: [] },
    { name: 'Англійська мова', average: 4.2, grades: [] },
  ],
}

export const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Зміна розкладу на 10 червня',
    content: 'Заняття з баз даних перенесено з аудиторії 312 до 201.',
    date: new Date(Date.now() - 86_400_000),
    category: 'schedule',
    isNew: true,
    author: 'Деканат',
  },
  {
    id: '2',
    title: 'Олімпіада з програмування',
    content: 'Запрошуємо взяти участь у внутрішній олімпіаді. Реєстрація до 15 червня.',
    date: new Date(Date.now() - 2 * 86_400_000),
    category: 'event',
    isNew: true,
  },
  {
    id: '3',
    title: 'Здача заліків',
    content: 'Нагадуємо про терміни здачі залікових робіт — до кінця місяця.',
    date: new Date(Date.now() - 5 * 86_400_000),
    category: 'important',
    isNew: false,
    author: 'Навчальна частина',
  },
  {
    id: '4',
    title: 'Оновлення бібліотечного фонду',
    content: 'До бібліотеки надійшли нові підручники з веб-розробки та машинного навчання.',
    date: new Date(Date.now() - 7 * 86_400_000),
    category: 'general',
    isNew: false,
  },
]

// key = weekday: 1=Пн … 6=Сб
export const mockWeekSchedule: Record<number, ScheduleEvent[]> = {
  1: [
    { id: 'w1-1', subject: 'Алгоритми та структури даних', teacher: 'Коваленко О. В.', room: '214', startTime: '08:00', endTime: '09:20', type: 'lecture', date: today, lessonNumber: 1 },
    { id: 'w1-2', subject: 'Веб-технології', teacher: 'Петренко С. М.', room: '108', startTime: '09:35', endTime: '10:55', type: 'lab', date: today, lessonNumber: 2 },
    { id: 'w1-3', subject: 'Бази даних', teacher: 'Іваненко Т. Р.', room: '312', startTime: '11:10', endTime: '12:30', type: 'practice', date: today, lessonNumber: 3 },
  ],
  2: [
    { id: 'w2-1', subject: 'Математика', teacher: 'Сидоренко В. П.', room: '101', startTime: '08:00', endTime: '09:20', type: 'lecture', date: today, lessonNumber: 1 },
    { id: 'w2-2', subject: 'Системне програмування', teacher: 'Мельник А. О.', room: '205', startTime: '09:35', endTime: '10:55', type: 'lab', date: today, lessonNumber: 2 },
  ],
  3: [
    { id: 'w3-1', subject: 'Англійська мова', teacher: 'Бондаренко Л. І.', room: '305', startTime: '08:00', endTime: '09:20', type: 'seminar', date: today, lessonNumber: 1 },
    { id: 'w3-2', subject: 'Алгоритми та структури даних', teacher: 'Коваленко О. В.', room: '214', startTime: '09:35', endTime: '10:55', type: 'practice', date: today, lessonNumber: 2 },
    { id: 'w3-3', subject: 'Бази даних', teacher: 'Іваненко Т. Р.', room: '312', startTime: '11:10', endTime: '12:30', type: 'lecture', date: today, lessonNumber: 3 },
  ],
  4: [
    { id: 'w4-1', subject: 'Веб-технології', teacher: 'Петренко С. М.', room: '108', startTime: '09:35', endTime: '10:55', type: 'lecture', date: today, lessonNumber: 2 },
    { id: 'w4-2', subject: 'Математика', teacher: 'Сидоренко В. П.', room: '101', startTime: '11:10', endTime: '12:30', type: 'practice', date: today, lessonNumber: 3 },
  ],
  5: [
    { id: 'w5-1', subject: 'Системне програмування', teacher: 'Мельник А. О.', room: '205', startTime: '08:00', endTime: '09:20', type: 'lecture', date: today, lessonNumber: 1 },
    { id: 'w5-2', subject: 'Англійська мова', teacher: 'Бондаренко Л. І.', room: '305', startTime: '09:35', endTime: '10:55', type: 'seminar', date: today, lessonNumber: 2 },
  ],
  6: [],
}

export function getNextClass(schedule: ScheduleEvent[]): ScheduleEvent | undefined {
  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return schedule.find((e) => e.startTime > currentTime)
}

const GRADE_TYPES: Grade['type'][] = ['exam', 'credit', 'test', 'coursework']

const makeGrades = (subjectId: string, count: number): Grade[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${subjectId}-g${i}`,
    subject: '',
    value: Math.floor(Math.random() * 2) + 4,
    maxValue: 5,
    date: new Date(Date.now() - (i + 1) * 7 * 86_400_000),
    type: GRADE_TYPES[i % GRADE_TYPES.length] as Grade['type'],
    teacherName: 'Коваленко О. В.',
  }))

export const mockGradesDetailed = {
  average: 4.2,
  totalSubjects: 6,
  subjects: [
    { name: 'Алгоритми та структури даних', average: 4.5, grades: makeGrades('alg', 4) },
    { name: 'Веб-технології', average: 4.8, grades: makeGrades('web', 3) },
    { name: 'Бази даних', average: 3.9, grades: makeGrades('db', 5) },
    { name: 'Математика', average: 4.1, grades: makeGrades('math', 4) },
    { name: 'Системне програмування', average: 3.7, grades: makeGrades('sys', 3) },
    { name: 'Англійська мова', average: 4.2, grades: makeGrades('eng', 4) },
  ],
}

export const mockAssignments: Assignment[] = [
  {
    id: 'a1',
    subject: 'Веб-технології',
    title: 'Лабораторна робота №3 — REST API',
    description: 'Реалізувати REST API для управління завданнями з використанням Node.js та Express.',
    deadline: new Date(Date.now() + 3 * 86_400_000),
    status: 'pending',
    teacherName: 'Петренко С. М.',
  },
  {
    id: 'a2',
    subject: 'Бази даних',
    title: 'Курсова робота',
    description: 'Проектування та реалізація бази даних для інформаційної системи коледжу.',
    deadline: new Date(Date.now() + 14 * 86_400_000),
    status: 'pending',
    teacherName: 'Іваненко Т. Р.',
  },
  {
    id: 'a3',
    subject: 'Алгоритми та структури даних',
    title: 'Практична робота №5 — Дерева',
    description: 'Реалізувати бінарне дерево пошуку з операціями вставки, видалення та обходу.',
    deadline: new Date(Date.now() - 2 * 86_400_000),
    status: 'overdue',
    teacherName: 'Коваленко О. В.',
  },
  {
    id: 'a4',
    subject: 'Математика',
    title: 'Контрольна робота №2',
    description: 'Теми: інтегральне числення, диференціальні рівняння.',
    deadline: new Date(Date.now() - 10 * 86_400_000),
    status: 'graded',
    grade: 4,
    teacherName: 'Сидоренко В. П.',
  },
  {
    id: 'a5',
    subject: 'Англійська мова',
    title: 'Есе — My Future Career',
    description: 'Написати есе обсягом 200-250 слів на тему майбутньої кар\'єри.',
    deadline: new Date(Date.now() - 5 * 86_400_000),
    status: 'submitted',
    teacherName: 'Бондаренко Л. І.',
  },
]
