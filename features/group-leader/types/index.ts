export interface ParentInfoDto {
  id: string
  studentId: string
  motherFullName: string | null
  motherPhone: string | null
  motherWorkplace: string | null
  fatherFullName: string | null
  fatherPhone: string | null
  fatherWorkplace: string | null
  guardianFullName: string | null
  guardianPhone: string | null
  guardianWorkplace: string | null
  guardianRelation: string | null
  address: string | null
  notes: string | null
  updatedById: string | null
  createdAt: string
  updatedAt: string
}

export interface GroupSummaryDto {
  id: string
  name: string
  studentCount: number
  speciality: string | null
  courseName: string | null
  educationForm: string | null
}

export interface GroupStudentDto {
  id: string
  fullName: string
  email: string | null
  birthday: string | null
  courseName: string | null
  groupName: string | null
  educationFormName: string | null
  personEducationPaymentTypeName: string | null
  hasParentInfo: boolean
  parentInfo: ParentInfoDto | null
}

export interface GroupDetailDto {
  id: string
  name: string
  studentCount: number
  students: GroupStudentDto[]
}

export interface UpdateParentInfoPayload {
  motherFullName?: string
  motherPhone?: string
  motherWorkplace?: string
  fatherFullName?: string
  fatherPhone?: string
  fatherWorkplace?: string
  guardianFullName?: string
  guardianPhone?: string
  guardianWorkplace?: string
  guardianRelation?: string
  address?: string
  notes?: string
}
