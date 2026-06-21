'use client'

import { useState } from 'react'
import {
  CheckCircle2,
  ClipboardPen,
  Loader2,
  Printer,
  Trash2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useGroups } from '@/features/groups/api'
import { DEFAULT_GROUP_FILTERS } from '@/features/groups/types'
import { cn } from '@/lib/utils'

import {
  useApproveIndividualPlan,
  useDeleteIndividualPlan,
  useGenerateForGroup,
  useIndividualPlansByGroup,
} from '../api'
import type { IndividualPlanDto, IndividualPlanDeviationType } from '../types'

const DEVIATION_LABELS: Record<IndividualPlanDeviationType, string> = {
  ELECTIVE_SELECTION: 'Вибір ВК',
  RETAKE: 'Перездача',
  EXTENDED_DEADLINE: 'Продовження терміну',
  TRANSFERRED_CREDIT: 'Перезарахування',
  EXEMPTED: 'Звільнення',
  ACCELERATED: 'Прискорене',
  ADDITIONAL_COMPONENT: 'Додатковий ОК',
}

export function IndividualPlansClient() {
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null)

  const { data: groups, isLoading: groupsLoading } = useGroups(DEFAULT_GROUP_FILTERS)
  const { data: plans, isLoading: plansLoading } = useIndividualPlansByGroup(selectedGroupId)

  const generateMut = useGenerateForGroup()
  const approveMut = useApproveIndividualPlan()
  const deleteMut = useDeleteIndividualPlan()

  const handleGenerate = () => {
    if (!selectedGroupId || !plans?.[0]?.assignmentId) {
      toast.error('Оберіть групу з призначеним навчальним планом.')
      return
    }
    generateMut.mutate(
      { groupId: selectedGroupId, assignmentId: plans[0].assignmentId },
      {
        onSuccess: (result) => {
          toast.success(
            `Створено ${result.created} ІНП (пропущено ${result.skipped} існуючих).`,
          )
        },
      },
    )
  }

  const handleApprove = (plan: IndividualPlanDto) => {
    approveMut.mutate(plan.id, {
      onSuccess: () => toast.success(`ІНП ${plan.student.personFIO} затверджено.`),
    })
  }

  const handleDelete = (plan: IndividualPlanDto) => {
    deleteMut.mutate(plan.id, {
      onSuccess: () => toast.success(`ІНП ${plan.student.personFIO} видалено.`),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          <ClipboardPen className="mr-2 inline-block h-6 w-6" />
          Індивідуальні навчальні плани
        </h1>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-72">
          <label className="mb-1 block text-sm font-medium">Академічна група</label>
          {groupsLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Оберіть групу" />
              </SelectTrigger>
              <SelectContent>
                {groups?.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {selectedGroupId && (
          <Button
            variant="outline"
            onClick={handleGenerate}
            disabled={generateMut.isPending}
          >
            {generateMut.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Users className="mr-2 h-4 w-4" />
            )}
            Сформувати ІНП для групи
          </Button>
        )}
      </div>

      {selectedGroupId && (
        <>
          {plansLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !plans || plans.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              Індивідуальних планів для цієї групи ще не створено.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">№</TableHead>
                    <TableHead>ПІБ студента</TableHead>
                    <TableHead className="w-28">Статус</TableHead>
                    <TableHead className="w-32">Відхилення</TableHead>
                    <TableHead className="w-40">Затверджено</TableHead>
                    <TableHead className="w-32">Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan, i) => (
                    <>
                      <TableRow
                        key={plan.id}
                        className={cn(
                          'cursor-pointer',
                          expandedPlanId === plan.id && 'bg-muted/50',
                        )}
                        onClick={() =>
                          setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)
                        }
                      >
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-medium">
                          {plan.student.personFIO}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={plan.approvedAt ? 'default' : 'secondary'}
                          >
                            {plan.approvedAt ? 'Затверджено' : 'Чернетка'}
                          </Badge>
                        </TableCell>
                        <TableCell>{plan.items.length}</TableCell>
                        <TableCell>
                          {plan.approvedAt
                            ? new Date(plan.approvedAt).toLocaleDateString('uk-UA')
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {!plan.approvedAt && (
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Затвердити"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleApprove(plan)
                                }}
                                disabled={approveMut.isPending}
                              >
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Видалити"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(plan)
                              }}
                              disabled={deleteMut.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedPlanId === plan.id && plan.items.length > 0 && (
                        <TableRow key={`${plan.id}-items`}>
                          <TableCell colSpan={6} className="bg-muted/30 p-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Компонент</TableHead>
                                  <TableHead className="w-24">Семестр</TableHead>
                                  <TableHead className="w-32">Кредити</TableHead>
                                  <TableHead className="w-40">Тип відхилення</TableHead>
                                  <TableHead>Примітка</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {plan.items.map((item) => (
                                  <TableRow key={item.id}>
                                    <TableCell>
                                      {item.component.code && (
                                        <span className="text-muted-foreground mr-2">
                                          {item.component.code}
                                        </span>
                                      )}
                                      {item.component.name}
                                    </TableCell>
                                    <TableCell>{item.semesterNumber}</TableCell>
                                    <TableCell>{item.component.totalEcts}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline">
                                        {DEVIATION_LABELS[item.deviationType]}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                      {item.notes ?? '—'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
