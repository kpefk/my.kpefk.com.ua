import type { Metadata } from 'next'

import { ScheduleViewClient } from '@/features/schedule/components/ScheduleViewClient'

export const metadata: Metadata = {
  title: 'Розклад занять',
}

export default function SchedulePage() {
  return <ScheduleViewClient />
}
