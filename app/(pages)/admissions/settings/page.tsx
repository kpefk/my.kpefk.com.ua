import type { Metadata } from 'next'

import { AdmissionsSettingsClient } from '@/features/admissions/components/AdmissionsSettingsClient'

export const metadata: Metadata = {
  title: 'Налаштування вступу',
}

export default function AdmissionsSettingsPage() {
  return <AdmissionsSettingsClient />
}
