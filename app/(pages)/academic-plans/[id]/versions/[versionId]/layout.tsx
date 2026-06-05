'use client'

import { useParams } from 'next/navigation'

import { VersionShell } from '@/features/academic-plans/components/version-shell'
import { useCurriculumVersion } from '@/features/academic-plans/api'

export default function VersionLayout({ children }: { children: React.ReactNode }) {
  const { id, versionId } = useParams<{ id: string; versionId: string }>()

  const { data: version, isLoading } = useCurriculumVersion(versionId)

  return (
    <VersionShell
      curriculumId={id}
      versionId={versionId}
      version={version}
      isLoading={isLoading}
    >
      {children}
    </VersionShell>
  )
}
