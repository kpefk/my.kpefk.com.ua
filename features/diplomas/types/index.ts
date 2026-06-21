// ─── Diploma DTOs (mirror backend src/diploma) ────────────────────────────────

export type DiplomaVariant = 'EXAM' | 'EDKI' | 'DIPLOMA_WORK' | 'DIPLOMA_PROJECT'
export type DiplomaComponentType =
  | 'REGULAR'
  | 'ELECTIVE'
  | 'COURSE_WORK'
  | 'PRACTICE'
  | 'ATTESTATION'
export type DiplomaGrade = 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'PASSED'
export type DiplomaStatus = 'DRAFT' | 'READY'

/** Форма контролю → визначає шкалу оцінювання у зведеній відомості. */
export type DiplomaControlForm = 'EXAM' | 'CREDIT' | 'GRADED_CREDIT'

export const CONTROL_FORM_LABELS: Record<DiplomaControlForm, string> = {
  EXAM: 'Екзамен',
  GRADED_CREDIT: 'Диф. залік',
  CREDIT: 'Залік',
}

/** CREDIT → шкала «зараховано/не зараховано»; решта (включно з null) → диференційована. */
export function isCreditScale(cf: DiplomaControlForm | null | undefined): boolean {
  return cf === 'CREDIT'
}

/** Допустимі оцінки для шкали ОК (порожнє = не атестовано). */
export function allowedGrades(cf: DiplomaControlForm | null | undefined): DiplomaGrade[] {
  return isCreditScale(cf) ? ['PASSED'] : ['EXCELLENT', 'GOOD', 'SATISFACTORY']
}

export const VARIANT_LABELS: Record<DiplomaVariant, string> = {
  EXAM: 'Кваліфікаційний іспит',
  EDKI: 'ЄДКІ',
  DIPLOMA_WORK: 'Дипломна робота',
  DIPLOMA_PROJECT: 'Дипломний проєкт',
}

export const COMPONENT_TYPE_LABELS: Record<DiplomaComponentType, string> = {
  REGULAR: 'ОК',
  ELECTIVE: 'ВК',
  COURSE_WORK: 'Курсова',
  PRACTICE: 'Практика',
  ATTESTATION: 'Атестація',
}

export const GRADE_LABELS: Record<DiplomaGrade, string> = {
  EXCELLENT: 'Відмінно',
  GOOD: 'Добре',
  SATISFACTORY: 'Задовільно',
  PASSED: 'Зараховано',
}

// ─── Templates ────────────────────────────────────────────────────────────────

export interface TemplateComponent {
  id?: string
  code: string | null
  nameUk: string
  nameEn: string | null
  ects: number | null
  type: DiplomaComponentType
  controlForm: DiplomaControlForm | null
  orderIndex: number
}

export interface TemplateSummary {
  id: string
  name: string
  specialtyCode: string | null
  specialtyName: string | null
  variant: DiplomaVariant
  isActive: boolean
  notes: string | null
  hasDiplomaDocx: boolean
  hasAddendumDocx: boolean
  componentCount: number
  updatedAt: string
}

export interface TemplateDetail extends Omit<TemplateSummary, 'componentCount'> {
  accrCertNumber: string | null
  accrCertSeries: string | null
  accrCertEndDate: string | null
  accrInstitutionName: string | null
  accrInstitutionNameEn: string | null
  components: TemplateComponent[]
}

export interface UpdateTemplatePayload {
  name?: string
  specialtyCode?: string
  specialtyName?: string
  variant?: DiplomaVariant
  notes?: string
  isActive?: boolean
  accrCertNumber?: string | null
  accrCertSeries?: string | null
  accrCertEndDate?: string | null
  accrInstitutionName?: string | null
  accrInstitutionNameEn?: string | null
}

export interface CreateTemplatePayload {
  name: string
  specialtyCode?: string
  specialtyName?: string
  variant: DiplomaVariant
}

// ─── Batches + diplomas ────────────────────────────────────────────────────────

export interface DiplomaBatch {
  id: string
  name: string
  academicYear: string | null
  sourceFileName: string | null
  count: number
  createdAt: string
}

// ─── Accreditation (ЄДЕБО lookup) ─────────────────────────────────────────────

export interface EdboAccreditationRecord {
  CertificateSpecialityId: number
  SpecialityName: string | null
  IsCertificateExist: boolean
  CertificateNumber: string | null
  CertificateSeries: string | null
  CertificateEndDate: string | null
  CertificateIssueDate: string | null
  CertificateSigner: string | null
  CertificateAccrLevel: string | null
  CertificateAccrReason: string | null
  AccreditationInstitutionId: number | null
}

// ─── Grade sheet ────────────────────────────────────────────────────────────────

export interface GradeSheetColumn {
  orderIndex: number
  code: string | null
  nameUk: string
  nameEn: string | null
  ects: number | null
  type: DiplomaComponentType
  controlForm: DiplomaControlForm | null
}

export interface GradeSheetRow {
  diplomaId: string
  lastNameUk: string
  firstNameUk: string
  isHonors: boolean
  status: DiplomaStatus
  studyGroupName: string | null
  grades: Record<number, { componentId: string; grade: DiplomaGrade | null }>
}

/** Окрема відомість однієї академічної групи. */
export interface GradeSheetGroup {
  groupName: string
  specialityName: string | null
  templateId: string | null
  columns: GradeSheetColumn[]
  rows: GradeSheetRow[]
}

export interface GradeSheetData {
  groups: GradeSheetGroup[]
}

export interface ImportPreview {
  count: number
  specialties: { code: string; name: string; count: number }[]
  items: {
    lastNameUk: string
    firstNameUk: string
    documentSeries: string | null
    documentNumber: string | null
    specialtyCode: string | null
    specialityName: string | null
    studyGroupName: string | null
  }[]
}

export interface DiplomaSummary {
  id: string
  lastNameUk: string
  firstNameUk: string
  documentSeries: string | null
  documentNumber: string | null
  specialityName: string | null
  studyGroupName: string | null
  status: DiplomaStatus
  isHonors: boolean
  template: { id: string; name: string; variant: DiplomaVariant } | null
  componentCount: number
}

export interface DiplomaComponent {
  id: string
  code: string | null
  nameUk: string
  nameEn: string | null
  ects: number | null
  type: DiplomaComponentType
  orderIndex: number
  grade: DiplomaGrade | null
}

export interface DiplomaDetail {
  id: string
  batchId: string | null
  template: { id: string; name: string; variant: DiplomaVariant } | null
  lastNameUk: string
  firstNameUk: string
  lastNameEn: string | null
  firstNameEn: string | null
  birthday: string | null
  edeboPersonCode: string | null
  personEducationId: number | null
  documentSeries: string | null
  documentNumber: string | null
  supplementId: number | null
  graduateDate: string | null
  issueDate: string | null
  specialityName: string | null
  specialityNameEn: string | null
  qualificationName: string | null
  studyProgramName: string | null
  studyGroupName: string | null
  bossFio: string | null
  bossPost: string | null
  qualificationWorkTitleUk: string | null
  qualificationWorkTitleEn: string | null
  isHonors: boolean
  honorsSuggested: boolean
  status: DiplomaStatus
  totalEcts: number
  components: DiplomaComponent[]
}

export interface UpdateDiplomaPayload {
  templateId?: string | null
  qualificationWorkTitleUk?: string | null
  qualificationWorkTitleEn?: string | null
  isHonors?: boolean
  status?: DiplomaStatus
}

export interface SetGradesPayload {
  grades: { componentId: string; grade: DiplomaGrade | null }[]
}

export function diplomaFullName(d: { lastNameUk: string; firstNameUk: string }): string {
  return `${d.lastNameUk} ${d.firstNameUk}`.trim()
}

export function formatEcts(n: number | null): string {
  return n === null ? '' : n.toFixed(1).replace('.', ',')
}
