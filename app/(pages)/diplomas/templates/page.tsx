import type { Metadata } from 'next'

import { DiplomaTemplatesClient } from '@/features/diplomas/components/DiplomaTemplatesClient'

export const metadata: Metadata = {
  title: 'Шаблони дипломів',
}

export default function DiplomaTemplatesPage() {
  return <DiplomaTemplatesClient />
}
