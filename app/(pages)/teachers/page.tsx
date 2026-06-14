import type { Metadata } from 'next'

import { TeachersClient } from '@/components/teachers/TeachersClient'

export const metadata: Metadata = {
  title: 'Викладачі',
}

export default function TeachersPage() {
  return <TeachersClient />
}
