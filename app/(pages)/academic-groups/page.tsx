import type { Metadata } from 'next'

import { AcademicGroupsClient } from '@/components/academic-groups/AcademicGroupsClient'

export const metadata: Metadata = {
  title: 'Академічні групи',
}

export default function AcademicGroupsPage() {
  return <AcademicGroupsClient />
}
