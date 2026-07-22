import type { Metadata } from 'next'

import { AttestationDueClient } from '@/features/teachers/components/AttestationDueClient'

export const metadata: Metadata = {
  title: 'Атестація викладачів',
}

export default function AttestationPage() {
  return <AttestationDueClient />
}
