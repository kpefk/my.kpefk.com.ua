// Дзеркало backend ParsedCurriculum (src/curriculum/import/curriculum-import.types.ts).
// Тримати синхронно з бекендом.

export type CurriculumPart = 'SECONDARY' | 'PROFESSIONAL'

export interface ParsedSemester {
  semesterNumber: number
  courseNumber: number
  weeks: number | null
}

export interface ParsedTerm {
  semesterNumber: number
  hours: number
  hoursPerWeek: number | null
}

export interface ParsedComponent {
  code: string | null
  name: string
  displayMarker: string | null
  integratedWithCode: string | null
  isElectivePlaceholder: boolean
  isElective: boolean
  electiveGroupCode: string | null
  examSemesters: number[]
  creditSemesters: number[]
  courseWorkSemesters: number[]
  rawExam: string | null
  totalHours: number | null
  ects: number | null
  auditoryHours: number | null
  lectureHours: number | null
  practicalHours: number | null
  seminarHours: number | null
  labHours: number | null
  selfStudyHours: number | null
  otherHours: number | null
  terms: ParsedTerm[]
  sourceRow: number
}

export interface ParsedSubtotal {
  label: string
  totalHours: number | null
  ects: number | null
  sourceRow: number
}

export interface ParsedSection {
  name: string
  part: CurriculumPart
  components: ParsedComponent[]
  subtotal: ParsedSubtotal | null
  sourceRow: number
}

export interface ParsedTimeBudgetRow {
  courseLabel: string
  theoryWeeks: number | null
  sessionWeeks: number | null
  practiceWeeks: number | null
  attestationWeeks: number | null
  holidayWeeks: number | null
  totalWeeks: number | null
}

export interface ParsedCurriculum {
  meta: {
    sourceFile: string
    academicYear: string | null
    specialtyName: string | null
  }
  semesters: ParsedSemester[]
  sections: ParsedSection[]
  timeBudget: ParsedTimeBudgetRow[]
  warnings: string[]
}

export type EducationFormValue = 'FULL_TIME' | 'PART_TIME' | 'DUAL'
export type AdmissionBasisValue = 'AFTER_9TH_GRADE' | 'AFTER_11TH_GRADE'

export interface ImportCommitPayload {
  programId: string
  educationForm: EducationFormValue
  admissionBasis: AdmissionBasisValue
  entryYear: number
  studyDurationMonths: number
  parsed: ParsedCurriculum
}

export interface ImportCommitResult {
  curriculumId: string
  versionId: string
  versionNumber: number
  stats: { sections: number; components: number; terms: number; projections: number }
}
