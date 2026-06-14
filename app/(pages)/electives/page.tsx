import type { Metadata } from 'next'

import { ElectivesClient } from '@/components/electives/ElectivesClient'

export const metadata: Metadata = {
  title: 'Вибіркові дисципліни',
}

export default function ElectivesPage() {
  return <ElectivesClient />
}
