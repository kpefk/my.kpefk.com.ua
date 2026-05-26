import type {
  User,
  ScheduleEvent,
  GradesSummary,
  Announcement,
  Assignment,
} from "@/lib/types";

// ─── User ────────────────────────────────────────────────────────────────────
// Replace with: GET /api/auth/me

export const mockCurrentUser: User = {
  id: "u-001",
  name: "Олексій Шевченко",
  email: "shevchenko@kpefk.edu.ua",
  role: "student",
  group: "КН-31",
  avatarUrl: null,
};

// ─── Schedule ────────────────────────────────────────────────────────────────
// Replace with: GET /api/schedule?date=today&group=КН-31

export const mockTodaySchedule: ScheduleEvent[] = [
  {
    id: "s-001",
    subject: "Вища математика",
    teacher: "Іваненко Михайло Васильович",
    room: "214",
    startTime: "08:30",
    endTime: "09:50",
    type: "lecture",
    date: new Date(),
    lessonNumber: 1,
  },
  {
    id: "s-002",
    subject: "Програмування (Python)",
    teacher: "Ткаченко Олена Іванівна",
    room: "Лаб. 105",
    startTime: "10:10",
    endTime: "11:30",
    type: "lab",
    date: new Date(),
    lessonNumber: 2,
  },
  {
    id: "s-003",
    subject: "Бази даних",
    teacher: "Коваль Сергій Петрович",
    room: "Лаб. 107",
    startTime: "12:00",
    endTime: "13:20",
    type: "practice",
    date: new Date(),
    lessonNumber: 3,
  },
  {
    id: "s-004",
    subject: "Алгоритми і структури даних",
    teacher: "Мороз Андрій Олегович",
    room: "218",
    startTime: "13:40",
    endTime: "15:00",
    type: "lecture",
    date: new Date(),
    lessonNumber: 4,
  },
];

export function getNextClass(
  schedule: ScheduleEvent[]
): ScheduleEvent | undefined {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return schedule.find((evt) => evt.startTime > currentTime);
}

// ─── Grades ──────────────────────────────────────────────────────────────────
// Replace with: GET /api/grades?studentId=u-001&semester=current

export const mockGradesSummary: GradesSummary = {
  average: 4.2,
  totalSubjects: 6,
  subjects: [
    {
      name: "Вища математика",
      average: 4.0,
      grades: [
        {
          id: "g-001",
          subject: "Вища математика",
          value: 4,
          maxValue: 5,
          date: new Date("2026-05-10"),
          type: "test",
          teacherName: "Іваненко М.В.",
        },
      ],
    },
    {
      name: "Програмування",
      average: 5.0,
      grades: [
        {
          id: "g-002",
          subject: "Програмування",
          value: 5,
          maxValue: 5,
          date: new Date("2026-05-15"),
          type: "test",
          teacherName: "Ткаченко О.І.",
        },
      ],
    },
    {
      name: "Бази даних",
      average: 4.5,
      grades: [
        {
          id: "g-003",
          subject: "Бази даних",
          value: 5,
          maxValue: 5,
          date: new Date("2026-05-20"),
          type: "test",
          teacherName: "Коваль С.П.",
        },
      ],
    },
    {
      name: "Фізика",
      average: 3.5,
      grades: [
        {
          id: "g-004",
          subject: "Фізика",
          value: 4,
          maxValue: 5,
          date: new Date("2026-05-18"),
          type: "test",
          teacherName: "Савченко Л.М.",
        },
      ],
    },
    {
      name: "Алгоритми",
      average: 4.0,
      grades: [
        {
          id: "g-005",
          subject: "Алгоритми",
          value: 4,
          maxValue: 5,
          date: new Date("2026-05-22"),
          type: "test",
          teacherName: "Мороз А.О.",
        },
      ],
    },
    {
      name: "Англійська мова",
      average: 4.5,
      grades: [
        {
          id: "g-006",
          subject: "Англійська мова",
          value: 5,
          maxValue: 5,
          date: new Date("2026-05-12"),
          type: "test",
          teacherName: "Павленко Н.В.",
        },
      ],
    },
  ],
};

// ─── Announcements ───────────────────────────────────────────────────────────
// Replace with: GET /api/announcements?limit=5

// ─── Weekly Schedule ─────────────────────────────────────────────────────────
// Replace with: GET /api/schedule?week=current&group=КН-31
// Indexed by weekday: 1=Mon … 6=Sat

const D = new Date();
function weekday(offset: number) {
  const d = new Date(D);
  d.setDate(D.getDate() + offset);
  return d;
}

export const mockWeekSchedule: Record<number, ScheduleEvent[]> = {
  1: [
    { id: "w1-1", subject: "Вища математика", teacher: "Іваненко М.В.", room: "214", startTime: "08:30", endTime: "09:50", type: "lecture", date: weekday(0), lessonNumber: 1 },
    { id: "w1-2", subject: "Програмування (Python)", teacher: "Ткаченко О.І.", room: "Лаб. 105", startTime: "10:10", endTime: "11:30", type: "lab", date: weekday(0), lessonNumber: 2 },
    { id: "w1-3", subject: "Бази даних", teacher: "Коваль С.П.", room: "Лаб. 107", startTime: "12:00", endTime: "13:20", type: "practice", date: weekday(0), lessonNumber: 3 },
    { id: "w1-4", subject: "Алгоритми і структури даних", teacher: "Мороз А.О.", room: "218", startTime: "13:40", endTime: "15:00", type: "lecture", date: weekday(0), lessonNumber: 4 },
  ],
  2: [
    { id: "w2-1", subject: "Англійська мова", teacher: "Павленко Н.В.", room: "312", startTime: "08:30", endTime: "09:50", type: "practice", date: weekday(1), lessonNumber: 1 },
    { id: "w2-2", subject: "Фізика", teacher: "Савченко Л.М.", room: "115", startTime: "10:10", endTime: "11:30", type: "lecture", date: weekday(1), lessonNumber: 2 },
    { id: "w2-3", subject: "Програмування (Python)", teacher: "Ткаченко О.І.", room: "Лаб. 105", startTime: "12:00", endTime: "13:20", type: "practice", date: weekday(1), lessonNumber: 3 },
  ],
  3: [
    { id: "w3-1", subject: "Вища математика", teacher: "Іваненко М.В.", room: "214", startTime: "10:10", endTime: "11:30", type: "practice", date: weekday(2), lessonNumber: 2 },
    { id: "w3-2", subject: "Алгоритми і структури даних", teacher: "Мороз А.О.", room: "Лаб. 107", startTime: "12:00", endTime: "13:20", type: "lab", date: weekday(2), lessonNumber: 3 },
    { id: "w3-3", subject: "Бази даних", teacher: "Коваль С.П.", room: "218", startTime: "13:40", endTime: "15:00", type: "lecture", date: weekday(2), lessonNumber: 4 },
    { id: "w3-4", subject: "Фізика", teacher: "Савченко Л.М.", room: "Лаб. 112", startTime: "15:10", endTime: "16:30", type: "lab", date: weekday(2), lessonNumber: 5 },
  ],
  4: [
    { id: "w4-1", subject: "Англійська мова", teacher: "Павленко Н.В.", room: "312", startTime: "08:30", endTime: "09:50", type: "practice", date: weekday(3), lessonNumber: 1 },
    { id: "w4-2", subject: "Програмування (Python)", teacher: "Ткаченко О.І.", room: "Лаб. 105", startTime: "10:10", endTime: "11:30", type: "lab", date: weekday(3), lessonNumber: 2 },
    { id: "w4-3", subject: "Вища математика", teacher: "Іваненко М.В.", room: "214", startTime: "12:00", endTime: "13:20", type: "seminar", date: weekday(3), lessonNumber: 3 },
  ],
  5: [
    { id: "w5-1", subject: "Бази даних", teacher: "Коваль С.П.", room: "Лаб. 107", startTime: "10:10", endTime: "11:30", type: "practice", date: weekday(4), lessonNumber: 2 },
    { id: "w5-2", subject: "Алгоритми і структури даних", teacher: "Мороз А.О.", room: "218", startTime: "12:00", endTime: "13:20", type: "practice", date: weekday(4), lessonNumber: 3 },
  ],
  6: [],
};

// ─── Grades Detailed ─────────────────────────────────────────────────────────
// Replace with: GET /api/grades/detailed?studentId=u-001&semester=current

export const mockGradesDetailed: GradesSummary = {
  average: 4.2,
  totalSubjects: 6,
  subjects: [
    {
      name: "Вища математика",
      average: 4.0,
      grades: [
        { id: "gd-001", subject: "Вища математика", value: 4, maxValue: 5, date: new Date("2026-03-15"), type: "test", teacherName: "Іваненко М.В." },
        { id: "gd-002", subject: "Вища математика", value: 3, maxValue: 5, date: new Date("2026-04-10"), type: "test", teacherName: "Іваненко М.В." },
        { id: "gd-003", subject: "Вища математика", value: 5, maxValue: 5, date: new Date("2026-05-05"), type: "test", teacherName: "Іваненко М.В." },
        { id: "gd-004", subject: "Вища математика", value: 4, maxValue: 5, date: new Date("2026-05-20"), type: "exam", teacherName: "Іваненко М.В." },
      ],
    },
    {
      name: "Програмування (Python)",
      average: 5.0,
      grades: [
        { id: "gd-005", subject: "Програмування (Python)", value: 5, maxValue: 5, date: new Date("2026-03-20"), type: "test", teacherName: "Ткаченко О.І." },
        { id: "gd-006", subject: "Програмування (Python)", value: 5, maxValue: 5, date: new Date("2026-04-18"), type: "coursework", teacherName: "Ткаченко О.І." },
        { id: "gd-007", subject: "Програмування (Python)", value: 5, maxValue: 5, date: new Date("2026-05-15"), type: "test", teacherName: "Ткаченко О.І." },
      ],
    },
    {
      name: "Бази даних",
      average: 4.7,
      grades: [
        { id: "gd-008", subject: "Бази даних", value: 4, maxValue: 5, date: new Date("2026-03-25"), type: "test", teacherName: "Коваль С.П." },
        { id: "gd-009", subject: "Бази даних", value: 5, maxValue: 5, date: new Date("2026-04-22"), type: "test", teacherName: "Коваль С.П." },
        { id: "gd-010", subject: "Бази даних", value: 5, maxValue: 5, date: new Date("2026-05-20"), type: "coursework", teacherName: "Коваль С.П." },
      ],
    },
    {
      name: "Фізика",
      average: 3.3,
      grades: [
        { id: "gd-011", subject: "Фізика", value: 3, maxValue: 5, date: new Date("2026-03-18"), type: "test", teacherName: "Савченко Л.М." },
        { id: "gd-012", subject: "Фізика", value: 4, maxValue: 5, date: new Date("2026-04-15"), type: "test", teacherName: "Савченко Л.М." },
        { id: "gd-013", subject: "Фізика", value: 3, maxValue: 5, date: new Date("2026-05-18"), type: "credit", teacherName: "Савченко Л.М." },
      ],
    },
    {
      name: "Алгоритми і структури даних",
      average: 4.0,
      grades: [
        { id: "gd-014", subject: "Алгоритми і структури даних", value: 4, maxValue: 5, date: new Date("2026-03-28"), type: "test", teacherName: "Мороз А.О." },
        { id: "gd-015", subject: "Алгоритми і структури даних", value: 4, maxValue: 5, date: new Date("2026-04-25"), type: "test", teacherName: "Мороз А.О." },
        { id: "gd-016", subject: "Алгоритми і структури даних", value: 4, maxValue: 5, date: new Date("2026-05-22"), type: "exam", teacherName: "Мороз А.О." },
      ],
    },
    {
      name: "Англійська мова",
      average: 4.7,
      grades: [
        { id: "gd-017", subject: "Англійська мова", value: 5, maxValue: 5, date: new Date("2026-03-12"), type: "test", teacherName: "Павленко Н.В." },
        { id: "gd-018", subject: "Англійська мова", value: 4, maxValue: 5, date: new Date("2026-04-20"), type: "test", teacherName: "Павленко Н.В." },
        { id: "gd-019", subject: "Англійська мова", value: 5, maxValue: 5, date: new Date("2026-05-12"), type: "credit", teacherName: "Павленко Н.В." },
      ],
    },
  ],
};

// ─── Assignments ─────────────────────────────────────────────────────────────
// Replace with: GET /api/assignments?studentId=u-001

export const mockAssignments: Assignment[] = [
  {
    id: "as-001",
    subject: "Програмування (Python)",
    title: "Лабораторна робота №5",
    description: "Реалізувати алгоритм сортування злиттям та порівняти його ефективність з іншими алгоритмами сортування.",
    deadline: new Date("2026-05-30"),
    status: "pending",
    teacherName: "Ткаченко О.І.",
  },
  {
    id: "as-002",
    subject: "Бази даних",
    title: "Реферат: NoSQL бази даних",
    description: "Підготувати реферат на тему порівняння реляційних та нереляційних баз даних на прикладі MongoDB та PostgreSQL.",
    deadline: new Date("2026-05-28"),
    status: "pending",
    teacherName: "Коваль С.П.",
  },
  {
    id: "as-003",
    subject: "Алгоритми і структури даних",
    title: "Розрахункова робота",
    description: "Розробити та реалізувати систему управління чергою з пріоритетами на основі купи (heap).",
    deadline: new Date("2026-06-06"),
    status: "pending",
    teacherName: "Мороз А.О.",
  },
  {
    id: "as-004",
    subject: "Англійська мова",
    title: "Essay: My Future Career",
    description: "Write an essay (200-250 words) about your future career in IT. Use Present Simple and Future Simple tenses.",
    deadline: new Date("2026-06-10"),
    status: "pending",
    teacherName: "Павленко Н.В.",
  },
  {
    id: "as-005",
    subject: "Фізика",
    title: "Контрольна робота №3",
    description: "Розв'язати задачі з розділу «Електромагнетизм». Оформити відповідно до вимог.",
    deadline: new Date("2026-05-20"),
    status: "overdue",
    teacherName: "Савченко Л.М.",
  },
  {
    id: "as-006",
    subject: "Програмування (Python)",
    title: "Лабораторна робота №4",
    description: "Реалізувати структуру даних «Бінарне дерево пошуку» з операціями вставки, пошуку та видалення.",
    deadline: new Date("2026-05-15"),
    status: "graded",
    grade: 5,
    teacherName: "Ткаченко О.І.",
  },
  {
    id: "as-007",
    subject: "Англійська мова",
    title: "Listening Comprehension Test",
    description: "Прослухати аудіозапис та дати відповіді на запитання.",
    deadline: new Date("2026-05-10"),
    status: "graded",
    grade: 4,
    teacherName: "Павленко Н.В.",
  },
  {
    id: "as-008",
    subject: "Бази даних",
    title: "Лабораторна робота №3",
    description: "Написати SQL-запити для роботи з реляційною базою даних університету.",
    deadline: new Date("2026-05-12"),
    status: "submitted",
    teacherName: "Коваль С.П.",
  },
];

export const mockAnnouncements: Announcement[] = [
  {
    id: "a-001",
    title: "Зміна розкладу на 28 травня",
    content:
      "У зв'язку з проведенням загальноколеджного заходу заняття 4-ї та 5-ї пар замінено. Оновлений розклад у системі.",
    date: new Date("2026-05-25T09:00:00"),
    category: "schedule",
    isNew: true,
    author: "Навчальна частина",
  },
  {
    id: "a-002",
    title: "Здача залікових робіт до 30 травня",
    content:
      "Нагадуємо студентам 3-х курсів про здачу залікових робіт з програмування. Дедлайн — 30 травня 2026 р.",
    date: new Date("2026-05-23T14:30:00"),
    category: "important",
    isNew: true,
    author: "Кафедра інформатики",
  },
  {
    id: "a-003",
    title: "День відкритих дверей 2026",
    content:
      "Запрошуємо всіх студентів взяти участь у Дні відкритих дверей коледжу, що відбудеться 5 червня.",
    date: new Date("2026-05-20T10:00:00"),
    category: "event",
    isNew: false,
    author: "Приймальна комісія",
  },
  {
    id: "a-004",
    title: "Оновлення бібліотечного фонду",
    content:
      "До бібліотеки надійшли нові підручники з веб-розробки та кібербезпеки. Перелік доступний у бібліотеці.",
    date: new Date("2026-05-18T11:00:00"),
    category: "general",
    isNew: false,
    author: "Бібліотека КПЕФК",
  },
];
