import type { Metadata } from 'next'

import { AttendanceClient } from '@/features/attendance/components/AttendanceClient'

export const metadata: Metadata = {
  title: 'Відвідуваність',
}

export default function AttendancePage() {
  return <AttendanceClient />
}
