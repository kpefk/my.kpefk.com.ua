import type { Metadata } from 'next'

import { TeacherLoadPage } from '@/features/teacher-load/components/teacher-load-page'

export const metadata: Metadata = {
  title: 'Педагогічне навантаження',
}

export default function TeacherLoadRoute() {
  return <TeacherLoadPage />
}
