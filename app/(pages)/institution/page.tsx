import type { Metadata } from 'next'

import { InstitutionClient } from '@/features/institution/components/InstitutionClient'

export const metadata: Metadata = {
  title: 'Про заклад',
}

export default function InstitutionPage() {
  return <InstitutionClient />
}
