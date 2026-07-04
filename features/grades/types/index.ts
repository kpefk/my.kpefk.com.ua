// ─── Grades DTOs (mirror backend src/grades/dto/*) ──────────────────────────

export type GradeScale = 'TWELVE_POINT' | 'FIVE_POINT'

export type NationalGrade =
  | 'EXCELLENT'
  | 'GOOD'
  | 'SATISFACTORY'
  | 'UNSATISFACTORY'
  | 'PASSED'
  | 'NOT_PASSED'

export type SemesterGradeStatus = 'ACTIVE' | 'SUPERSEDED'

export type TermControlForm = 'EXAM' | 'CREDIT' | 'GRADED_CREDIT'

// ─── Response DTOs ──────────────────────────────────────────────────────────

export interface SemesterGradeDto {
  id: string
  studentId: string
  studentName: string
  curriculumComponentTermId: string
  subjectName: string
  componentCode: string | null
  academicYear: string
  semesterNumber: number
  controlForm: TermControlForm
  gradeScale: GradeScale
  finalGrade: number | null
  nationalGrade: NationalGrade
  attempt: number
  status: SemesterGradeStatus
  recordedById: string
  recordedAt: string
}

export interface GradeSheetStudentDto {
  studentId: string
  fullName: string
  grade: SemesterGradeDto | null
  /** Середня поточна оцінка за семестр (AttendanceRecord.grade), для підказки формули ваг. */
  currentAverage: number | null
}

export interface GradeSheetDto {
  curriculumComponentTermId: string
  subjectName: string
  componentCode: string | null
  controlForm: TermControlForm | null
  gradeScale: GradeScale
  ects: number
  totalHours: number
  semesterNumber: number
  students: GradeSheetStudentDto[]
}

export interface StudentTranscriptGradeDto {
  id: string
  subjectName: string
  componentCode: string | null
  ects: number
  semesterNumber: number
  controlForm: TermControlForm
  gradeScale: GradeScale
  finalGrade: number | null
  nationalGrade: NationalGrade
  attempt: number
}

export interface StudentTranscriptDto {
  studentId: string
  fullName: string
  grades: StudentTranscriptGradeDto[]
}

export interface TeacherDisciplineDto {
  curriculumComponentTermId: string
  subjectName: string
  componentCode: string | null
  semesterNumber: number
  controlForm: TermControlForm | null
  gradeScale: GradeScale
  groupId: string | null
  groupName: string | null
  academicYear: string
}

export interface GradeScaleInfoDto {
  gradeScale: GradeScale
  min: number
  max: number
  controlForm: TermControlForm | null
}

/** Глобальна вагова схема формули підказки підсумкової оцінки (поточна + екзамен = 100%). */
export interface GradeWeightSettingsDto {
  currentWeight: number
  examWeight: number
}

// ─── Request payloads ───────────────────────────────────────────────────────

export interface CreateSemesterGradePayload {
  studentId: string
  curriculumComponentTermId: string
  academicYear: string
  finalGrade?: number | null
  nationalGradeOverride?: NationalGrade
  isRetake?: boolean
}

export interface StudentGradeInput {
  studentId: string
  finalGrade?: number | null
  nationalGradeOverride?: NationalGrade
}

export interface BulkGradeEntryPayload {
  curriculumComponentTermId: string
  groupId: string
  academicYear: string
  grades: StudentGradeInput[]
}

// ─── Display constants ──────────────────────────────────────────────────────

export const NATIONAL_GRADE_LABELS: Record<NationalGrade, string> = {
  EXCELLENT: 'Відмінно',
  GOOD: 'Добре',
  SATISFACTORY: 'Задовільно',
  UNSATISFACTORY: 'Незадовільно',
  PASSED: 'Зараховано',
  NOT_PASSED: 'Не зараховано',
}

export const GRADE_SCALE_LABELS: Record<GradeScale, string> = {
  TWELVE_POINT: '12-бальна',
  FIVE_POINT: '5-бальна',
}

export const CONTROL_FORM_LABELS: Record<TermControlForm, string> = {
  EXAM: 'Екзамен',
  CREDIT: 'Залік',
  GRADED_CREDIT: 'Диференційований залік',
}
