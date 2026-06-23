import type { Metadata } from 'next'

import { ScheduleHubClient } from '@/features/schedule/components/ScheduleHubClient'

export const metadata: Metadata = {
  title: 'Розклад занять',
}

export default function SchedulePage() {
  return <ScheduleHubClient />
}
