import type { Metadata } from 'next'

import { RatingClient } from '@/features/rating/components/RatingClient'

export const metadata: Metadata = {
  title: 'Рейтинг успішності',
}

export default function RatingPage() {
  return <RatingClient />
}
