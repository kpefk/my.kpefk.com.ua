import type { Metadata } from 'next'

import { ScheduleResourceViewClient } from '@/features/schedule/components/ScheduleResourceViewClient'

export const metadata: Metadata = {
  title: 'Розклад за ресурсом',
}

export default function ScheduleResourcesPage() {
  return <ScheduleResourceViewClient />
}
