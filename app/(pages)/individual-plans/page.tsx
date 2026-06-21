import type { Metadata } from 'next'

import { IndividualPlansClient } from '@/features/individual-plans/components/IndividualPlansClient'

export const metadata: Metadata = {
  title: 'Індивідуальні навчальні плани',
}

export default function IndividualPlansPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <IndividualPlansClient />
    </div>
  )
}
