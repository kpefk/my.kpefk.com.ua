import type { Metadata } from 'next'

import { StudentsClient } from '@/components/students/StudentsClient'

export const metadata: Metadata = {
  title: 'Студенти',
}

export default function StudentsPage() {
  return <StudentsClient />
}
