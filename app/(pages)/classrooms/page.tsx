import type { Metadata } from 'next'

import { ClassroomsClient } from '@/components/classrooms/ClassroomsClient'

export const metadata: Metadata = {
  title: 'Навчальні кабінети',
}

export default function ClassroomsPage() {
  return <ClassroomsClient />
}
