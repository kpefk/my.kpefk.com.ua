import type { Metadata } from 'next'

import { UsersClient } from '@/components/users/UsersClient'

export const metadata: Metadata = {
  title: 'Користувачі',
}

export default function UsersPage() {
  return <UsersClient />
}
