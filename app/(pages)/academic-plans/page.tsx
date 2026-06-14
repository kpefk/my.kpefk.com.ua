import type { Metadata } from 'next'

import { AcademicPlansClient } from '@/components/academic-plans/AcademicPlansClient'

export const metadata: Metadata = {
  title: 'Навчальні плани',
}

export default function AcademicPlansPage() {
  return <AcademicPlansClient />
}
