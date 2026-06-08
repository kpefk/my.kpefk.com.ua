'use client'

import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

import {
  COMPONENT_KIND_LABELS,
  COMPONENT_TYPE_LABELS,
  PRACTICE_TYPE_LABELS,
  isSecondaryEducationSection,
  type ComponentType,
  type CurriculumComponentDto,
  type CurriculumComponentKind,
  type CurriculumSectionType,
  type PracticeType,
} from '../types'


// ─── Collapsible section wrapper ──────────────────────────────────────────────

function FormSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-border rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-3 py-2 bg-muted/40 hover:bg-muted/70 text-sm font-medium transition-colors"
      >
        {title}
        <ChevronDown
          size={15}
          className={cn('text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && <div className="flex flex-col gap-3 px-3 py-3">{children}</div>}
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ComponentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sectionName: string
  sectionType?: CurriculumSectionType
  defaultOrderIndex: number
  /**
   * Pre-filled code suggestion for new components in sections that use sequential
   * codes (e.g. "ОК3", "ФК7"). The user can freely edit or clear it before saving.
   * Ignored in edit mode (initialData is present).
   */
  suggestedCode?: string
  initialData?: CurriculumComponentDto
  onSubmit: (data: {
    name: string
    code?: string | null
    componentType: ComponentType
    componentKind: CurriculumComponentKind
    totalEcts: number
    totalHours: number
    isMandatory: boolean
    practiceType?: PracticeType
    orderIndex: number
    // Hours breakdown
    auditoryHours?: number
    lectureHours?: number
    practicalHours?: number
    seminarHours?: number
    labHours?: number
    selfStudyHours?: number
    otherHours?: number
    znoPreparationHours?: number
    // Elective group
    groupCode?: string
  }) => void
  isPending: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ComponentDialog({
  open,
  onOpenChange,
  sectionName,
  sectionType,
  defaultOrderIndex,
  suggestedCode,
  initialData,
  onSubmit,
  isPending,
}: ComponentDialogProps) {
  const isSecondaryEdu = sectionType ? isSecondaryEducationSection(sectionType) : false

  // ── Section 1: basics ──────────────────────────────────────────────────────
  const [name, setName] = useState(initialData?.name ?? '')
  const [code, setCode] = useState(initialData?.code ?? '')
  const [componentType, setComponentType] = useState<ComponentType>(
    initialData?.componentType ?? 'DISCIPLINE',
  )
  const [componentKind, setComponentKind] = useState<CurriculumComponentKind>(
    initialData?.componentKind ?? 'REGULAR',
  )
  const [totalEcts, setTotalEcts] = useState(
    initialData ? String(Number(initialData.totalEcts)) : '',
  )
  const [totalHours, setTotalHours] = useState(
    initialData ? String(initialData.totalHours) : '',
  )
  const [isMandatory, setIsMandatory] = useState(initialData?.isMandatory ?? true)
  const [practiceType, setPracticeType] = useState<PracticeType | ''>(
    initialData?.practiceType ?? '',
  )
  const [groupCode, setGroupCode] = useState(initialData?.groupCode ?? '')

  // ── Section 2: hours breakdown ─────────────────────────────────────────────
  const [auditoryHours, setAuditoryHours] = useState(String(initialData?.auditoryHours ?? ''))
  const [lectureHours, setLectureHours] = useState(String(initialData?.lectureHours ?? ''))
  const [practicalHours, setPracticalHours] = useState(String(initialData?.practicalHours ?? ''))
  const [seminarHours, setSeminarHours] = useState(String(initialData?.seminarHours ?? ''))
  const [labHours, setLabHours] = useState(String(initialData?.labHours ?? ''))
  const [selfStudyHours, setSelfStudyHours] = useState(String(initialData?.selfStudyHours ?? ''))
  const [otherHours, setOtherHours] = useState(String(initialData?.otherHours ?? ''))
  const [znoHours, setZnoHours] = useState(String(initialData?.znoPreparationHours ?? ''))

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? '')
      // Edit mode: restore saved code. Create mode: use suggestion if provided.
      setCode(initialData?.code ?? suggestedCode ?? '')
      setComponentType(initialData?.componentType ?? 'DISCIPLINE')
      setComponentKind(initialData?.componentKind ?? 'REGULAR')
      const ects = initialData ? Number(initialData.totalEcts) : NaN
      setTotalEcts(initialData ? String(ects) : '')
      // Auto-derive hours; for secondary-edu components use the stored value
      setTotalHours(
        initialData
          ? ects > 0
            ? String(Math.round(ects * 30))
            : String(initialData.totalHours)
          : '',
      )
      setIsMandatory(initialData?.isMandatory ?? true)
      setPracticeType(initialData?.practiceType ?? '')
      setGroupCode(initialData?.groupCode ?? '')
      setAuditoryHours(String(initialData?.auditoryHours ?? ''))
      setLectureHours(String(initialData?.lectureHours ?? ''))
      setPracticalHours(String(initialData?.practicalHours ?? ''))
      setSeminarHours(String(initialData?.seminarHours ?? ''))
      setLabHours(String(initialData?.labHours ?? ''))
      setSelfStudyHours(String(initialData?.selfStudyHours ?? ''))
      setOtherHours(String(initialData?.otherHours ?? ''))
      setZnoHours(String(initialData?.znoPreparationHours ?? ''))
    }
  }, [open, initialData, suggestedCode])

  // ── Validation ─────────────────────────────────────────────────────────────
  const ectsVal = isSecondaryEdu ? 0 : parseFloat(totalEcts.replace(',', '.'))
  const hoursVal = parseInt(totalHours, 10)
  const ectsValid = isSecondaryEdu || (Number.isFinite(ectsVal) && ectsVal >= 0)
  // For non-secondary edu, hours are derived from ECTS so we only check ectsValid.
  // For secondary edu, hours are entered manually so we need a valid integer too.
  const canSubmit =
    name.trim().length >= 2 &&
    ectsValid &&
    (isSecondaryEdu ? Number.isFinite(hoursVal) && hoursVal >= 0 : true)

  // ── Helpers ────────────────────────────────────────────────────────────────
  const toOptInt = (s: string): number | undefined => {
    const n = parseInt(s, 10)
    return Number.isFinite(n) && n >= 0 ? n : undefined
  }

  /** When the user types ECTS, auto-update the derived hours field. */
  const handleEctsChange = (value: string) => {
    const normalized = value.replace(',', '.')
    setTotalEcts(normalized)
    const ects = parseFloat(normalized)
    if (Number.isFinite(ects) && ects >= 0) {
      setTotalHours(String(Math.round(ects * 30)))
    }
  }

  const handleSubmit = () => {
    if (!canSubmit) return
    // For non-secondary edu, hours are always derived (1 ECTS = 30 h).
    const computedHours = isSecondaryEdu ? hoursVal : Math.round(ectsVal * 30)
    onSubmit({
      name: name.trim(),
      code: code.trim() || null,
      componentType,
      componentKind,
      totalEcts: ectsVal,
      totalHours: computedHours,
      isMandatory,
      practiceType:
        componentType === 'PRACTICE' && practiceType ? (practiceType as PracticeType) : undefined,
      orderIndex: initialData?.orderIndex ?? defaultOrderIndex,
      // Hours breakdown
      auditoryHours: toOptInt(auditoryHours),
      lectureHours: toOptInt(lectureHours),
      practicalHours: toOptInt(practicalHours),
      seminarHours: toOptInt(seminarHours),
      labHours: toOptInt(labHours),
      selfStudyHours: toOptInt(selfStudyHours),
      otherHours: toOptInt(otherHours),
      znoPreparationHours: isSecondaryEdu ? toOptInt(znoHours) : undefined,
      // Elective group
      groupCode: groupCode.trim() || undefined,
    })
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Редагувати компонент' : `Новий компонент — ${sectionName}`}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">

          {/* ── SECTION 1: Основне ────────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Основне
            </p>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="comp-name">Назва *</Label>
              <Input
                id="comp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Алгоритмізація та програмування"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="comp-code">Код компонента</Label>
                <Input
                  id="comp-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="ОК12"
                  maxLength={20}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="comp-group-code">Код групи (вибіркові)</Label>
                <Input
                  id="comp-group-code"
                  value={groupCode}
                  onChange={(e) => setGroupCode(e.target.value)}
                  placeholder="ВК1"
                  maxLength={20}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="comp-kind">Категорія *</Label>
                <Select
                  value={componentKind}
                  onValueChange={(v) => setComponentKind(v as CurriculumComponentKind)}
                >
                  <SelectTrigger id="comp-kind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(COMPONENT_KIND_LABELS) as [CurriculumComponentKind, string][]).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="comp-type">Тип (деталізований)</Label>
                <Select
                  value={componentType}
                  onValueChange={(v) => setComponentType(v as ComponentType)}
                >
                  <SelectTrigger id="comp-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(COMPONENT_TYPE_LABELS) as [ComponentType, string][]).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {componentType === 'PRACTICE' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="practice-type">Вид практики</Label>
                <Select
                  value={practiceType}
                  onValueChange={(v) => setPracticeType(v as PracticeType)}
                >
                  <SelectTrigger id="practice-type">
                    <SelectValue placeholder="Оберіть вид..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(PRACTICE_TYPE_LABELS) as [PracticeType, string][]).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {isSecondaryEdu ? (
                <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                  <Label htmlFor="comp-hours">Годин *</Label>
                  <Input
                    id="comp-hours"
                    type="number"
                    min={0}
                    value={totalHours}
                    onChange={(e) => setTotalHours(e.target.value)}
                    placeholder="180"
                  />
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="comp-ects">ЄКТС *</Label>
                    <Input
                      id="comp-ects"
                      type="number"
                      min={0}
                      step={0.5}
                      max={999}
                      value={totalEcts}
                      onChange={(e) => handleEctsChange(e.target.value)}
                      placeholder="6.0"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="comp-hours" className="text-muted-foreground">
                      Годин (авто)
                    </Label>
                    <Input
                      id="comp-hours"
                      type="number"
                      min={0}
                      value={totalHours}
                      readOnly
                      disabled
                      placeholder="180"
                      className="bg-muted/50 cursor-not-allowed"
                    />
                  </div>
                </>
              )}
            </div>

            {isSecondaryEdu && (
              <p className="text-xs text-muted-foreground -mt-2">
                ЄКТС не застосовується для компонентів загальної середньої освіти — буде збережено як 0.
              </p>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="comp-mandatory"
                checked={isMandatory}
                onCheckedChange={(v) => setIsMandatory(!!v)}
              />
              <Label htmlFor="comp-mandatory" className="cursor-pointer font-normal">
                Обов&#39;язковий компонент
              </Label>
            </div>
          </div>

          {/* ── SECTION 2: Розподіл годин ─────────────────────────────────── */}
          <FormSection title="Розподіл годин">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="h-auditory">Аудиторні (загалом)</Label>
                <Input
                  id="h-auditory"
                  type="number"
                  min={0}
                  value={auditoryHours}
                  onChange={(e) => setAuditoryHours(e.target.value)}
                  placeholder="180"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="h-lecture">Лекційні</Label>
                <Input
                  id="h-lecture"
                  type="number"
                  min={0}
                  value={lectureHours}
                  onChange={(e) => setLectureHours(e.target.value)}
                  placeholder="60"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="h-practical">Практичні заняття</Label>
                <Input
                  id="h-practical"
                  type="number"
                  min={0}
                  value={practicalHours}
                  onChange={(e) => setPracticalHours(e.target.value)}
                  placeholder="60"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="h-seminar">Семінарські</Label>
                <Input
                  id="h-seminar"
                  type="number"
                  min={0}
                  value={seminarHours}
                  onChange={(e) => setSeminarHours(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="h-lab">Лабораторні</Label>
                <Input
                  id="h-lab"
                  type="number"
                  min={0}
                  value={labHours}
                  onChange={(e) => setLabHours(e.target.value)}
                  placeholder="30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="h-self">Самостійна робота</Label>
                <Input
                  id="h-self"
                  type="number"
                  min={0}
                  value={selfStudyHours}
                  onChange={(e) => setSelfStudyHours(e.target.value)}
                  placeholder="90"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="h-other">Інші (консультації)</Label>
                <Input
                  id="h-other"
                  type="number"
                  min={0}
                  value={otherHours}
                  onChange={(e) => setOtherHours(e.target.value)}
                  placeholder="0"
                />
              </div>
              {isSecondaryEdu && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="h-zno">Підготовка до ЗНО</Label>
                  <Input
                    id="h-zno"
                    type="number"
                    min={0}
                    value={znoHours}
                    onChange={(e) => setZnoHours(e.target.value)}
                    placeholder="12"
                  />
                </div>
              )}
            </div>
          </FormSection>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Скасувати
          </Button>
          <Button disabled={isPending || !canSubmit} onClick={handleSubmit}>
            {initialData ? 'Зберегти' : 'Додати компонент'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
