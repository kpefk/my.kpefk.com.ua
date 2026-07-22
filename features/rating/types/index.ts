// ─── Rating DTOs (mirror backend src/rating/dto/rating.dto.ts) ────────────────

import type { GradeScale } from '@/features/grades/types'

export interface RatingDisciplineDto {
  componentName: string
  componentCode: string | null
  grade: number
  gradeScale: GradeScale
  /** Нормалізована до 100-бальної (2 знаки). */
  normalized: number
}

export interface RatingRowDto {
  studentId: string
  fullName: string
  /** ЄДЕБО-значення джерела фінансування; null = ще не синхронізовано. */
  paymentTypeName: string | null
  isBudget: boolean
  disciplines: RatingDisciplineDto[]
  averageScore: number | null
  bonusPoints: number
  bonusReason: string | null
  totalScore: number | null
  rank: number | null
}

export interface GroupRatingDto {
  groupId: string
  groupName: string
  academicYear: string
  semesterNumber: number
  budgetCount: number
  rows: RatingRowDto[]
}

export interface SetRatingBonusPayload {
  studentId: string
  academicYear: string
  semesterNumber: number
  points: number
  reason?: string
}
