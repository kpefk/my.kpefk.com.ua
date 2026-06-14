export type CatalogStatus = 'DRAFT' | 'OPEN' | 'LATE' | 'CLOSED'
export type SelectionMethod = 'VOLUNTARY' | 'ASSIGNED'
export type SelectionStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'
export type TermControlForm = 'EXAM' | 'CREDIT' | 'GRADED_CREDIT'

export const CONTROL_FORM_LABELS: Record<TermControlForm, string> = {
  EXAM: 'Екзамен',
  CREDIT: 'Залік',
  GRADED_CREDIT: 'Диф. залік',
}

export interface CurriculumTermDto {
  id: string
  semesterNumber: number
  ects: number
  hours: number
  controlForm: TermControlForm | null
  component: {
    name: string
    lectureHours: number | null
    practicalHours: number | null
    labHours: number | null
  }
}

export interface ElectiveComponentDto {
  id: string
  name: string
  oppCode: string
  oppName: string
  semester: number
  ectsCredits: number
  cyclicComm: string
  syllabusUrl: string | null
  academicYear: string
  isHigherEd: boolean
  catalogStatus: CatalogStatus
  curriculumTermId: string | null
  curriculumTerm: CurriculumTermDto | null
  createdAt: string
  updatedAt: string
}

export interface ElectiveRegistrationDto {
  id: string
  studentId: string
  electiveId: string
  elective: ElectiveComponentDto
  academicYear: string
  semester: number
  method: SelectionMethod
  status: SelectionStatus
  submittedAt: string
  confirmedAt: string | null
  confirmedBy: string | null
  directorApproved: boolean
}

export interface GroupSelectionStatDto {
  elective: {
    id: string
    name: string
    semester: number
    oppCode: string
  }
  count: number
  total: number
  percentage: number
  hasQuorum: boolean
}

export interface EnrollmentRowDto {
  no: number
  fullName: string
  studentId: string
  voluntary: string
  assigned: string
  status: SelectionStatus | null
}

export interface StudentWithoutSelectionDto {
  id: string
  personFIO: string
}

// For admin: curriculum terms available for linking
export interface CurriculumTermForLinkingDto {
  id: string
  semesterNumber: number
  ects: number
  hours: number
  controlForm: TermControlForm | null
  component: {
    id: string
    name: string
    lectureHours: number | null
    practicalHours: number | null
    labHours: number | null
    section: {
      version: {
        versionNumber: number
        curriculum: {
          program: {
            name: string
            specialty: { code: string; name: string }
          }
        }
      }
    }
  }
}

export interface CreateElectiveComponentPayload {
  name: string
  oppCode: string
  oppName: string
  semester: number
  ectsCredits: number
  cyclicComm: string
  syllabusUrl?: string
  academicYear: string
  isHigherEd?: boolean
}

export interface UpdateElectiveComponentPayload {
  name?: string
  oppCode?: string
  oppName?: string
  semester?: number
  ectsCredits?: number
  cyclicComm?: string
  syllabusUrl?: string | null
  isHigherEd?: boolean
  curriculumTermId?: string | null
}

export const CATALOG_STATUS_LABELS: Record<CatalogStatus, string> = {
  DRAFT: 'Чернетка',
  OPEN: 'Вибір відкрито',
  LATE: 'Продовжений вибір',
  CLOSED: 'Вибір завершено',
}

export const SELECTION_METHOD_LABELS: Record<SelectionMethod, string> = {
  VOLUNTARY: 'Заява',
  ASSIGNED: 'Наказ',
}

// ── New architecture types ────────────────────────────────────────────────────

export interface CurriculumComponentSummaryDto {
  id: string
  name: string
  lectureHours: number | null
  practicalHours: number | null
  labHours: number | null
  terms: Array<{
    semesterNumber: number
    ects: number
    hours: number
    controlForm: TermControlForm | null
  }>
  section: {
    cycleCode: string
    version: {
      versionNumber: number
      curriculum: {
        program: {
          name: string
          specialty: { code: string; name: string }
        }
      }
    }
  }
}

export interface ElectiveOfferingDto {
  id: string
  seasonId: string
  componentId: string
  component: CurriculumComponentSummaryDto
  syllabusUrl: string | null
  isHigherEd: boolean
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface ElectiveBlockDto {
  id: string
  name: string
  semesterNumber: number
  minSelections: number
  maxSelections: number
}

export interface ElectiveBlockSeasonDto {
  id: string
  blockId: string
  block: ElectiveBlockDto
  academicYear: string
  catalogStatus: CatalogStatus
  offerings?: ElectiveOfferingDto[]
  _count?: { offerings: number; selections: number }
  createdAt: string
  updatedAt: string
}

export interface StudentElectiveSelectionDto {
  id: string
  studentId: string
  seasonId: string
  season: {
    id: string
    academicYear: string
    catalogStatus: CatalogStatus
    block: Pick<ElectiveBlockDto, 'id' | 'name' | 'semesterNumber'>
  }
  componentId: string
  component: {
    id: string
    name: string
    terms: Array<{
      semesterNumber: number
      ects: number
      hours: number
      controlForm: TermControlForm | null
    }>
  }
  academicYear: string
  method: SelectionMethod
  status: SelectionStatus
  overrideReason: string | null
  submittedAt: string
  confirmedAt: string | null
}

export interface CreateOfferingPayload {
  componentId: string
  syllabusUrl?: string
  isHigherEd?: boolean
  description?: string
}

export interface UpdateOfferingPayload {
  syllabusUrl?: string | null
  isHigherEd?: boolean
  description?: string | null
}

export interface StudentSelectPayload {
  seasonId: string
  componentId: string
}

export interface AdminAssignV2Payload {
  studentId: string
  seasonId: string
  componentId: string
  overrideReason?: string
}

// ── Campaign types (річна кампанія вибору ВК) ─────────────────────────────────

export interface ElectiveCampaignDto {
  id: string
  academicYear: string
  status: CatalogStatus
  publishedAt: string | null
  selectionDeadline: string | null
  lateDeadline: string | null
  pedagogicalCouncilDate: string | null
  pedagogicalCouncilProtocolNumber: string | null
  directorOrderNumber: string | null
  directorOrderDate: string | null
  notes: string | null
  _count?: { blockSeasons: number }
  createdAt: string
  updatedAt: string
}

export interface ElectiveCampaignDetailDto extends Omit<ElectiveCampaignDto, '_count'> {
  blockSeasons: Array<{
    id: string
    blockId: string
    academicYear: string
    catalogStatus: CatalogStatus
    block: {
      id: string
      name: string
      semesterNumber: number
      section: {
        version: {
          id: string
          versionNumber: number
          curriculum: {
            entryYear: number
            educationForm: string
            program: { name: string; specialty: { code: string; name: string } }
          }
        }
      }
    }
    _count: { offerings: number; selections: number }
  }>
}

export interface CreateCampaignPayload {
  academicYear: string
  selectionDeadline?: string
  lateDeadline?: string
  notes?: string
}

export interface UpdateCampaignPayload {
  selectionDeadline?: string
  lateDeadline?: string
  pedagogicalCouncilDate?: string
  pedagogicalCouncilProtocolNumber?: string
  directorOrderNumber?: string
  directorOrderDate?: string
  notes?: string
}

export interface GenerateCampaignResult {
  created: number
  adopted: number
  totalRelevantBlocks: number
  /** Діагностика розривів «група → версія → блок → семестр» */
  warnings: string[]
}

export interface CampaignProgressRowDto {
  group: { id: string; name: string; studentCount: number }
  season: {
    id: string
    blockName: string
    semesterNumber: number
    catalogStatus: CatalogStatus
  }
  voluntaryCount: number
  topComponent: { id: string; name: string; count: number } | null
  quorumReached: boolean
  outcome: { componentId: string; componentName: string; orderNumber: string | null } | null
}

export interface CampaignProgressDto {
  campaign: { id: string; academicYear: string; status: CatalogStatus }
  rows: CampaignProgressRowDto[]
}

export interface ConfirmGroupSelectionPayload {
  componentId?: string
  orderNumber?: string
  orderDate?: string
}

export interface ConfirmGroupSelectionResult {
  componentId: string
  componentName: string
  quorumReached: boolean
  confirmedVoluntary: number
  assignedByOrder: number
  dissenting: number
  workingCurriculum: {
    status:
      | 'ADDED'
      | 'ALREADY_PRESENT'
      | 'NO_WORKING_CURRICULUM'
      | 'APPROVED_LOCKED'
      | 'SEMESTER_NOT_COVERED'
  }
}
