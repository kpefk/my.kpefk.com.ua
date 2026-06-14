import type { Metadata } from 'next'

import { SettingsClient } from '@/components/settings/SettingsClient'

export const metadata: Metadata = {
  title: 'Налаштування',
}

export default function SettingsPage() {
  return <SettingsClient />
}
