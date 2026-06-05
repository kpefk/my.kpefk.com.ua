'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function VersionIndexPage() {
  const { id, versionId } = useParams<{ id: string; versionId: string }>()
  const router = useRouter()

  useEffect(() => {
    router.replace(`/academic-plans/${id}/versions/${versionId}/structure`)
  }, [id, versionId, router])

  return null
}
