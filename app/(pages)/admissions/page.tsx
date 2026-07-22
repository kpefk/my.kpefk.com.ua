import type { Metadata } from 'next'

import { AdmissionsOverviewClient } from '@/features/admissions/components/AdmissionsOverviewClient'

export const metadata: Metadata = {
  title: 'Вступна кампанія',
}

export default function AdmissionsPage() {
  return <AdmissionsOverviewClient />
}
