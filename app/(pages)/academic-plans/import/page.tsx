import type { Metadata } from 'next'

import { CurriculumImportClient } from '@/features/curriculum-import/components/CurriculumImportClient'

export const metadata: Metadata = {
  title: 'Імпорт навчального плану',
}

export default function CurriculumImportPage() {
  return <CurriculumImportClient />
}
