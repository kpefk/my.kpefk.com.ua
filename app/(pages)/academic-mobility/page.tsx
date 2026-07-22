import type { Metadata } from 'next'

import { MobilityClient } from '@/features/academic-mobility/components/MobilityClient'

export const metadata: Metadata = {
  title: 'Академічна мобільність',
}

export default function AcademicMobilityPage() {
  return <MobilityClient />
}
