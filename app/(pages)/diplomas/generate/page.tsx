import type { Metadata } from 'next'

import { DiplomasClient } from '@/features/diplomas/components/DiplomasClient'

export const metadata: Metadata = {
  title: 'Дипломи',
}

export default function DiplomasPage() {
  return <DiplomasClient />
}
