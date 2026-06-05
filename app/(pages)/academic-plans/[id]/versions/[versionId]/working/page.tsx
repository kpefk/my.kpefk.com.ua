'use client'

import { useParams } from 'next/navigation'

import { WorkingCurriculumPanel } from '@/features/academic-plans/components/working-curriculum-panel'
import { useCurriculumVersion } from '@/features/academic-plans/api'
import { useUser } from '@/store/auth.store'

const MANAGER_ROLES = ['HEAD_OF_DEPARTMENT', 'DEPUTY_DIRECTOR', 'DIRECTOR', 'ADMINISTRATOR']

export default function WorkingCurriculumPage() {
  const { versionId } = useParams<{ versionId: string }>()
  const user = useUser()
  const canManage = !!user && MANAGER_ROLES.includes(user.role)

  const { data: version } = useCurriculumVersion(versionId)

  // Derive max semester count from the version structure
  let maxSemesters = 8
  if (version?.sections) {
    let max = 0
    for (const section of version.sections) {
      for (const component of section.components) {
        for (const term of component.terms) {
          if (term.semesterNumber > max) max = term.semesterNumber
        }
      }
    }
    if (max > 0) maxSemesters = max
  }

  return (
    <WorkingCurriculumPanel
      versionId={versionId}
      canManage={canManage}
      maxSemesters={maxSemesters}
    />
  )
}
