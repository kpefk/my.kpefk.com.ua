export type IndividualPlanDeviationType =
  | 'ELECTIVE_SELECTION'
  | 'RETAKE'
  | 'EXTENDED_DEADLINE'
  | 'TRANSFERRED_CREDIT'
  | 'EXEMPTED'
  | 'ACCELERATED'
  | 'ADDITIONAL_COMPONENT'

export interface IndividualPlanItemDto {
  id: string
  planId: string
  componentId: string
  semesterNumber: number
  deviationType: IndividualPlanDeviationType
  notes: string | null
  resolvedAt: string | null
  component: {
    id: string
    code: string | null
    name: string
    totalEcts: string
  }
}

export interface IndividualPlanDto {
  id: string
  studentId: string
  assignmentId: string
  isActive: boolean
  notes: string | null
  approvedAt: string | null
  approvedBy: string | null
  createdAt: string
  updatedAt: string
  student: { id: string; personFIO: string }
  assignment: {
    id: string
    groupId: string
    group: { id: string; name: string }
    curriculum: { id: string; totalEcts: string }
    version: { id: string; versionNumber: number }
  }
  items: IndividualPlanItemDto[]
}

export interface CreateIndividualPlanPayload {
  studentId: string
  assignmentId: string
  notes?: string
}

export interface CreatePlanItemPayload {
  componentId: string
  semesterNumber: number
  deviationType: IndividualPlanDeviationType
  notes?: string
}

export interface UpdatePlanItemPayload {
  deviationType?: IndividualPlanDeviationType
  notes?: string
}

export interface GenerateForGroupResult {
  created: number
  skipped: number
  total: number
}

// ── Appendix print data types ────────────────────────────────────────

export interface Appendix2Data {
  student: { id: string; fullName: string; group: string }
  block: { name: string; semester: number }
  academicYear: string
  offerings: {
    componentId: string
    code: string | null
    name: string
    ects: string
    syllabusUrl: string | null
    isHigherEd: boolean
  }[]
  currentSelection: {
    componentId: string
    method: 'VOLUNTARY' | 'ASSIGNED'
    status: string
  } | null
}

export interface Appendix3Row {
  no: number
  fullName: string
  componentName: string
  componentCode: string
  method: 'VOLUNTARY' | 'ASSIGNED' | null
  methodLabel: string
}

export interface Appendix3Data {
  title: string
  block: string
  semester: number
  academicYear: string
  group: string
  rows: Appendix3Row[]
  totalStudents: number
  voluntaryCount: number
  assignedCount: number
}

// ── ECTS threshold validation ────────────────────────────────────────

export interface ElectiveThresholdResult {
  versionId: string
  totalEcts: number
  electiveEcts: number
  percentage: number
  threshold: number
  isValid: boolean
  message: string
}
