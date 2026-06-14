import type { Metadata } from 'next'

import { GradesClient } from '@/components/grades/GradesClient'

export const metadata: Metadata = {
  title: 'Оцінки',
}

export default function GradesPage() {
  return <GradesClient />
}
