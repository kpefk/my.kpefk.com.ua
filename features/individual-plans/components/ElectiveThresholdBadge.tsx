'use client'

import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

import { useElectiveThreshold } from '../api'

interface ElectiveThresholdBadgeProps {
  versionId: string
}

export function ElectiveThresholdBadge({ versionId }: ElectiveThresholdBadgeProps) {
  const { data, isLoading } = useElectiveThreshold(versionId)

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin" />
  }

  if (!data) return null

  return (
    <Badge
      variant={data.isValid ? 'default' : 'destructive'}
      className="cursor-help gap-1"
      title={`${data.message}\nВибіркова: ${data.electiveEcts} ЄКТС / Загалом: ${data.totalEcts} ЄКТС`}
    >
      {data.isValid ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <AlertTriangle className="h-3 w-3" />
      )}
      ВК: {data.percentage.toFixed(1)}%
    </Badge>
  )
}
