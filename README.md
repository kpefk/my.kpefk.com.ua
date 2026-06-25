# MyKPEFK — Frontend

> Клієнтський додаток інформаційної системи управління освітнім процесом Ковельського промислово-економічного фахового коледжу ЛНТУ (КПЕФК)

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

Copyright (C) 2026  Tymchenko Serhii

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed WITHOUT ANY WARRANTY; without even the implied
warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU Affero General Public License for more details.

---

## Про систему

**MyKPEFK** — це інформаційна система управління освітнім процесом закладу фахової передвищої освіти (ФПО). Система побудована відповідно до вимог Закону України «Про фахову передвищу освіту» (№2745-VIII) та спрямована на автоматизацію адміністративних процесів коледжу: від синхронізації студентів і викладачів з ЄДЕБО до формування навчальних планів, розподілу навантаження та вибіркових дисциплін.

### Юридична основа

Система враховує вимоги таких нормативних актів:

| Документ | Що регулює в системі |
|----------|----------------------|
| **Закон №2745-VIII** «Про фахову передвищу освіту» | Рівень та ступінь ФПО (фаховий молодший бакалавр), освітньо-професійні програми, структура закладу, навчальні плани, навантаження (ст. 47-60) |
| **Закон №2145-VIII** «Про освіту» | Загальні засади освітньої діяльності, якість освіти, мова освітнього процесу |
| **Закон №1556-VII** «Про вищу освіту» | Стандарти освіти, кредитна система ЄКТС, академічна мобільність (застосовується субсидіарно) |
| **Наказ МОН №510** (02.05.2023) | Типове положення про організацію освітнього процесу в закладах ФПО: форми здобуття освіти, види занять, оцінювання, бюджет часу (1800 год/рік, 60 кредитів ЄКТС) |
| **Наказ МОН №686** (18.06.2021) | Норми часу для планування та обліку навчальної роботи педагогічних працівників: 720 год/ставку, академічна година 45 хв |
| **Наказ МОН №472** (24.05.2022) | Зміни до норм часу: уточнення поділу на підгрупи, норми для практик |

> Більше інформації — у каталозі `Законодавча база/` в корені репозиторію.

### Ключові поняття ФПО в системі

- **Фаховий молодший бакалавр** — освітньо-професійний ступінь, що здобувається на рівні ФПО
- **Освітньо-професійна програма (ОПП)** — єдиний комплекс освітніх компонентів для підготовки фахівця
- **Кредит ЄКТС** — одиниця вимірювання обсягу навчального навантаження (30 годин = 1 кредит)
- **Навчальний план** — основа для структури навчального процесу (семестри, компоненти, години)
- **Робочий навчальний план** — оперативний план на конкретний навчальний рік
- **Навчальне навантаження** — 720 годин на 1 ставку викладача на рік (до 1.5 ставки = 1080 год)

---

## Основні можливості

- **Автентифікація** — вхід, реєстрація (студент), Google OAuth, двофакторна аутентифікація (2FA), відновлення паролю
- **Дашборд** — оглядова сторінка з зведеними картками
- **Студенти** — пошук/фільтрація, детальна картка, ручний запуск синхронізації з ЄДЕБО
- **Викладачі** — пошук/фільтрація, детальна картка, підвищення кваліфікації, ручний запуск синхронізації з ЄДЕБО
- **Академічні групи** — таблиця груп, детальна картка, призначення куратора, ручний запуск синхронізації з ЄДЕБО
- **Аудиторний фонд** — таблиця, детальна картка/редактор, керування фото (drag-and-drop), паспорт аудиторії (PDF)
- **Навчальні плани (навчальний процес)** — спеціальності, освітні програми, навчальні плани з версіонуванням, секції, компоненти, семестри, бюджет часу, навчальний календар, призначення груп, робочі плани
- **Навантаження викладачів** — зведення за робочим планом та викладачем, генерація призначень, керування призначеннями занять, робочий процес підтвердження наказом
- **Вибіркові дисципліни** — сезони вибіркових блоків, каталог пропозицій, процес вибору студентами, адміністративне керування з автопризначенням, статистика груп, накази
- **Керування користувачами** (адмін) — створення, перегляд/редагування, прив'язка до профілів студента/викладача
- **Профіль** — власна сторінка профілю, зміна паролю; публічний профіль за ID (`/profile/[id]`)
- **Вступна кампанія** — інтеграція з API ЄДЕБО щодо вступу
- **Освітні програми** — перегляд та керування освітніми програмами, прив'язаними до спеціальностей
- **Розклад, оцінки, завдання** — маршрути існують; деякі сторінки наразі використовують тестові дані

---

## Технічний стек

| Технологія | Версія | Призначення |
|------------|--------|-------------|
| [Next.js](https://nextjs.org/) | ^16.2.9 | Фреймворк (App Router) |
| [React](https://react.dev/) | 19.2.4 | Бібліотека UI |
| [TypeScript](https://typescriptlang.org/) | ^5 | Мова програмування |
| [Tailwind CSS](https://tailwindcss.com/) | ^4 | Стилізація |
| [shadcn](https://ui.shadcn.com/) + Radix UI | ^4.8.0 | Компоненти |
| [TanStack Query](https://tanstack.com/query) | ^5 | Серверний стан / отримання даних |
| [Zustand](https://zustand.docs.pmnd.rs/) | ^5 | Клієнтський стан (автентифікація) |
| [TanStack Form](https://tanstack.com/form) | ^1 | Управління станом форм |
| [Zod](https://zod.dev/) | ^4 | Валідація схем |
| [Axios](https://axios-http.com/) | ^1 | HTTP-клієнт |
| [sonner](https://sonner.emilkowal.ski/) | ^2 | Toast-сповіщення |
| [next-themes](https://github.com/pacocoursey/next-themes) | ^0.4 | Тема (темна/світла/системна) |
| [framer-motion](https://www.framer-motion.com/) | ^12 | Анімації |
| [@dnd-kit](https://dndkit.com/) | ^6/^10 | Drag-and-drop (перевпорядкування фото) |
| [lucide-react](https://lucide.dev/) | ^1 | Іконки |
| [xlsx](https://www.npmjs.com/package/xlsx) | ^0.18.5 | Парсинг Excel-файлів |

---

## Структура проєкту

```
app/
├── (auth)/                 # Група маршрутів — публічні сторінки автентифікації
│   ├── sign-in/
│   ├── sign-up/
│   ├── forgot-password/
│   ├── reset-password/
│   └── layout.tsx
├── (pages)/                # Група маршрутів — захищені сторінки дашборду
│   ├── dashboard/
│   ├── students/
│   ├── teachers/
│   ├── academic-groups/
│   ├── academic-plans/     # Керування навчальними планами
│   │   └── [id]/
│   │       └── versions/
│   │           └── [versionId]/
│   ├── classrooms/
│   ├── my-classroom/
│   ├── educational-programs/
│   ├── electives/
│   │   └── admin/
│   ├── teacher-load/
│   ├── profile/
│   │   ├── [id]/
│   │   └── settings/
│   ├── users/
│   ├── schedule/
│   ├── grades/
│   ├── assignments/
│   ├── settings/
│   └── layout.tsx
├── layout.tsx
├── providers.tsx
└── globals.css

features/                   # Модулі функціональності (API-хуки + компоненти + типи)
├── auth/
├── students/
├── teachers/
├── groups/
├── classrooms/
├── admin/
├── users/
├── entrance/
├── academic-plans/
├── electives/
└── teacher-load/

components/
├── ui/                     # shadcn/ui примітиви
├── dashboard/              # Sidebar, Header, DashboardShell, AuthGuard
├── academic-plans/
├── electives/
├── teacher-load/
├── educational-programs/
├── classrooms/
├── students/
├── teachers/
├── academic-groups/
├── assignments/
├── grades/
├── my-classroom/
├── schedule/
├── settings/
├── common/
└── users/

lib/
├── api/
│   ├── client.ts           # Екземпляр Axios + типізовані обгортки + 401 refresh interceptor
│   └── endpoints.ts        # Константа ENDPOINTS — усі рядки API-шляхів
├── services/
├── stores/
│   └── auth.store.ts       # Zustand store автентифікації
├── query/
│   └── client.ts
├── types/
│   └── user-role.types.ts
├── types.ts
├── academic-year.ts
├── mock-data.ts
└── utils.ts                # cn() — clsx + tailwind-merge
```

---

## Передумови

- **Node.js** >= 20
- **npm** (у проєкті є `package-lock.json`)
- **MyKPEFK backend** — працюючий та доступний (без нього автентифікація та отримання даних неможливі)
- Змінна середовища `NEXT_PUBLIC_API_URL`

---

## Налаштування середовища

Створіть `.env.local` у корені проєкту:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

| Змінна | Опис |
|--------|------|
| `NEXT_PUBLIC_API_URL` | Базова URL-адреса API бекенду MyKPEFK |

Автентифікація базується на куках — токени не зберігаються у фронтенді.

---

## Встановлення та локальна розробка

```bash
# Встановлення залежностей
npm install

# Запуск сервера розробки
npm run dev
# → http://localhost:3000

# Продакшн-збірка
npm run build

# Запуск продакшн-сервера
npm start

# Лінтер
npm run lint

# Перевірка типів (немає окремого скрипту — запускати вручну)
npx tsc --noEmit
```

Бекенд повинен працювати за адресою `NEXT_PUBLIC_API_URL` для функціонування автентифікації та даних.

---

## Маршрутизація та структура додатку

Додаток використовує **Next.js 16 App Router** з двома групами маршрутів:

| Група | Маршрути | Захист |
|-------|----------|--------|
| `(auth)` | `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password` | Публічні |
| `(pages)` | `/dashboard`, `/students`, `/teachers`, `/academic-plans`, `/teacher-load`, `/electives` та ін. | Захищені сесією |

**Захист реалізовано на клієнті.** `middleware.ts` відсутній. `(pages)/layout.tsx` — клієнтський компонент, який при монтуванні викликає `useMe()`. Якщо API повертає помилку (немає сесії), відбувається редирект на `/sign-in`.

Динамічні маршрути: `/profile/[id]` — завантаження профілю користувача за ID.

---

## Інтеграція з API

Усі HTTP-виклики проходять через **`lib/api/client.ts`**:

- Єдиний екземпляр `axios` з `baseURL = NEXT_PUBLIC_API_URL` та `withCredentials: true`
- Типізовані обгортки: `apiGet<T>`, `apiPost<T>`, `apiPatch<T>`, `apiDelete<T>`
- **401 refresh interceptor:** при отриманні 401 — спроба `POST /auth/refresh`; при помилці — очищення стану та редирект на `/sign-in`
- **Нормалізація помилок:** усі помилки стають екземплярами `ApiError` з `statusCode`, `message` та опціональним масивом `errors`

**Усі рядки ендпоінтів** зберігаються в `lib/api/endpoints.ts` як `ENDPOINTS`. Ніколи не хардкодити рядки шляхів у файлах функціональності.

**Отримання даних повністю клієнтське.** Серверних дій, `fetch()` у серверних компонентах немає. Функціональність використовує хуки TanStack Query (`useQuery`, `useMutation`) у `features/{feature}/api/index.ts`.

### Простори API-ендпоінтів

| Простір | Префікс шляху | Опис |
|---------|---------------|------|
| `AUTH` | `/auth/` | Вхід, реєстрація, вихід, профіль, оновлення |
| `PASSWORD_RECOVERY` | `/auth/password-recovery/` | Скидання та новий пароль |
| `TWO_FA` | `/auth/2fa/` | TOTP та email 2FA |
| `USERS` | `/users/` | Профіль, зміна паролю |
| `ADMIN` | `/admin/` | Адміністративне керування |
| `CLASSROOMS` | `/classrooms/` | CRUD, фото, паспорт |
| `ENTRANCE` | `/entrance/` | API вступної кампанії ЄДЕБО |
| `STUDENTS` | `/students/` | Список студентів |
| `GROUPS` | `/groups/` | Групи, призначення куратора |
| `STAFF` | `/staff/` | Викладачі, підвищення кваліфікації |
| `ELECTIVES` | `/electives/` | Каталог, вибори, адміністративне керування (v1 + v2), кампанії |
| `EDBO` | `/edbo/sync/` | Ручні запуски синхронізації |
| `CURRICULUM` | `/curricula/`, `/curriculum-versions/`, `/curriculum-sections/`, `/curriculum-components/`, `/working-curricula/` тощо | Повний домен навчальних планів |
| `TEACHER_LOAD` | `/teacher-load/` | Зведення навантаження, призначення предметів/занять, підтвердження |

---

## UI та стилізація

- **Tailwind CSS v4** — конфігурація через `@tailwindcss/postcss`; без `tailwind.config.js`
- **shadcn/ui** компоненти в `components/ui/` — джерело всіх примітивів UI
- **`cn()`** (`lib/utils.ts`) — `clsx` + `tailwind-merge` — використовувати для всієї умовної композиції класів
- **Тема** — `next-themes` зі стратегією `class`; `ThemeProvider` у `providers.tsx`
- **Toast-сповіщення** — `sonner`; `<Toaster>` у `providers.tsx`
- **Анімації** — `framer-motion`
- **Іконки** — `lucide-react`

---

## Правила розробки

- **API-виклики — лише в `lib/api/client.ts`.** Не додавати сирих `axios.get()` або `fetch()` у компонентах.
- **ENDPOINTS для всіх шляхів.** Нові ендпоінти додавати до `lib/api/endpoints.ts`.
- **Колокація функціональності.** API-хуки, компоненти та типи функціональності знаходяться в `features/{feature}/`. Спільні UI-примітиви — в `components/ui/`.
- **Не дублювати `components/ui/` примітиви.** Використовувати наявні shadcn-компоненти.
- **Типи фронтенду повинні відповідати DTO бекенду.**
- **Не перетворювати серверні компоненти на клієнтські** без необхідності.

---

## Корисні команди

```bash
npm run dev          # Сервер розробки (http://localhost:3000)
npm run build        # Продакшн-збірка
npm start            # Запуск продакшн-сервера
npm run lint         # ESLint
npx tsc --noEmit     # Перевірка типів
```

---

## API-документація

Swagger UI бекенду доступний за адресою `http://localhost:4000/docs` при працюючому бекенді.

---

## Контакти

- **Email**: [s.tymchenko@kpefk.com.ua](mailto:s.tymchenko@kpefk.com.ua)
- **Організація**: [КПЕФК ЛНТУ](https://kpefk.com.ua)

---

> Цей README відображає поточний стан репозиторію. Тримайте його узгодженим з фактичним кодом — якщо змінюється маршрутизація, API-структура або залежності, оновлюйте відповідні розділи.
