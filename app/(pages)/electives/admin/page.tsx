import type { Metadata } from 'next'

import { ElectivesAdminClient } from '@/components/electives/ElectivesAdminClient'

export const metadata: Metadata = {
  title: 'ВК — Адміністрування',
}

export default function ElectivesAdminPage() {
  return <ElectivesAdminClient />
}
