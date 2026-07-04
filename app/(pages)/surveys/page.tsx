import type { Metadata } from 'next'

import { SurveysClient } from '@/features/surveys/components/SurveysClient'

export const metadata: Metadata = {
  title: 'Опитування',
}

export default function SurveysPage() {
  return <SurveysClient />
}
