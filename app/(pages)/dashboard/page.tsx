import type { Metadata } from 'next'

import { DashboardClient } from '@/features/dashboard/components/DashboardClient'

export const metadata: Metadata = {
  title: 'Головна',
}

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <DashboardClient />
    </div>
  )
}
