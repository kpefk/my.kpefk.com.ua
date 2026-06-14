import type { Metadata } from 'next'

import { MyClassroomClient } from '@/components/my-classroom/MyClassroomClient'

export const metadata: Metadata = {
  title: 'Мій кабінет',
}

export default function MyClassroomPage() {
  return <MyClassroomClient />
}
