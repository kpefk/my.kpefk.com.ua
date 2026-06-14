import type { Metadata } from 'next'

import { AssignmentsClient } from '@/components/assignments/AssignmentsClient'

export const metadata: Metadata = {
  title: 'Завдання',
}

export default function AssignmentsPage() {
  return <AssignmentsClient />
}
