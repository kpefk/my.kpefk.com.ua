import type { Metadata } from 'next'

import { EducationalProgramsClient } from '@/components/educational-programs/EducationalProgramsClient'

export const metadata: Metadata = {
  title: 'Освітні програми',
}

export default function EducationalProgramsPage() {
  return <EducationalProgramsClient />
}
