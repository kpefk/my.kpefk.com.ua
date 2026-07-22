import type { Metadata } from 'next'

import { CreditRecognitionClient } from '@/features/credit-recognition/components/CreditRecognitionClient'

export const metadata: Metadata = {
  title: 'Перезарахування кредитів',
}

export default function CreditRecognitionPage() {
  return <CreditRecognitionClient />
}
