import type { Metadata } from 'next'

import { GradesClient } from '@/features/grades/components/GradesClient'

export const metadata: Metadata = {
  title: 'Оцінки',
}

export default function GradesPage() {
  return <GradesClient />
}
