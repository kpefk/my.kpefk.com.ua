import type { Metadata } from 'next'

import { MyGroupClient } from '@/features/group-leader/components/MyGroupClient'

export const metadata: Metadata = {
  title: 'Моя група',
}

export default function MyGroupPage() {
  return <MyGroupClient />
}
