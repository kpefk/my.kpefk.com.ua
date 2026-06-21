import type { Metadata } from 'next'

import { ScheduleBuilderClient } from '@/features/schedule/components/ScheduleBuilderClient'

export const metadata: Metadata = {
  title: 'Конструктор розкладу',
}

export default function ScheduleBuilderPage() {
  return <ScheduleBuilderClient />
}
