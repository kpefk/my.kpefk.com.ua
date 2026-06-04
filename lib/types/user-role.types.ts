export const USER_ROLES = {
  STUDENT: 'Студент',
  TEACHER: 'Викладач',
  SCHEDULE_DISPATCHER: 'Диспетчер розкладу',
  HEAD_OF_DEPARTMENT: 'Завідувач відділення',
  DEPUTY_DIRECTOR: 'Заступник директора',
  DIRECTOR: 'Директор',
  ADMINISTRATOR: 'Адміністратор',
} as const

export type UserRole = keyof typeof USER_ROLES

export const USER_ROLE_LABELS: Record<UserRole, string> = USER_ROLES

export const USER_ROLE_COLORS: Record<UserRole, string> = {
  STUDENT:             'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  TEACHER:             'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  SCHEDULE_DISPATCHER: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  HEAD_OF_DEPARTMENT:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  DEPUTY_DIRECTOR:     'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  DIRECTOR:            'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  ADMINISTRATOR:       'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
}
