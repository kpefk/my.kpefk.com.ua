'use client'

import { useParams } from 'next/navigation'

import { GroupAssignmentsPanel } from '@/features/academic-plans/components/group-assignments-panel'
import { useUser } from '@/store/auth.store'

const MANAGER_ROLES = ['HEAD_OF_DEPARTMENT', 'DEPUTY_DIRECTOR', 'DIRECTOR', 'ADMINISTRATOR']

export default function GroupsPage() {
  const { id, versionId } = useParams<{ id: string; versionId: string }>()
  const user = useUser()
  const canManage = !!user && MANAGER_ROLES.includes(user.role)

  return (
    <GroupAssignmentsPanel
      curriculumId={id}
      versionId={versionId}
      canManage={canManage}
    />
  )
}
