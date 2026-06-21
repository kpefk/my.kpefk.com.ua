import type { Metadata } from 'next'

import { GradeSheetClient } from '@/features/diplomas/components/GradeSheetClient'

export const metadata: Metadata = {
  title: 'Зведені відомості',
}

export default function ReportsPage() {
  return <GradeSheetClient />
}
