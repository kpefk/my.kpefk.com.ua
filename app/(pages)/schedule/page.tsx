import type { Metadata } from 'next'

import { ScheduleClient } from '@/components/schedule/ScheduleClient'

export const metadata: Metadata = {
  title: 'Розклад',
}

export default function SchedulePage() {
  return <ScheduleClient />
}
