import type { Metadata } from 'next'

import { AdmissionsApplicationsClient } from '@/features/admissions/components/AdmissionsApplicationsClient'

export const metadata: Metadata = {
  title: 'Заяви вступників',
}

export default function AdmissionsApplicationsPage() {
  return <AdmissionsApplicationsClient />
}
