import type { GradeScale, GradeWeightSettingsDto, NationalGrade, TermControlForm } from '../types'

export const TWELVE_POINT_MIN = 1
export const TWELVE_POINT_MAX = 12
export const FIVE_POINT_MIN = 1
export const FIVE_POINT_MAX = 5

export function gradeRange(scale: GradeScale): { min: number; max: number } {
  return scale === 'TWELVE_POINT'
    ? { min: TWELVE_POINT_MIN, max: TWELVE_POINT_MAX }
    : { min: FIVE_POINT_MIN, max: FIVE_POINT_MAX }
}

export function isCredit(controlForm: TermControlForm | null): boolean {
  return controlForm === 'CREDIT'
}

/**
 * Обчислює підказку підсумкової оцінки за ваговою формулою (дзеркало backend
 * grade-formula.ts — тривіальна арифметика, без round-trip на кожне натискання).
 * currentAverage = null → повертає examScore як є (clamped).
 */
export function computeSuggestedGrade(
  currentAverage: number | null,
  examScore: number,
  weights: GradeWeightSettingsDto,
  scale: GradeScale,
): number {
  const { min, max } = gradeRange(scale)
  const raw = currentAverage === null
    ? examScore
    : (currentAverage * weights.currentWeight + examScore * weights.examWeight) / 100
  return Math.min(max, Math.max(min, Math.round(raw)))
}

export function nationalGradeColor(grade: NationalGrade): string {
  switch (grade) {
    case 'EXCELLENT':
      return 'text-emerald-600 dark:text-emerald-400'
    case 'GOOD':
      return 'text-blue-600 dark:text-blue-400'
    case 'SATISFACTORY':
      return 'text-amber-600 dark:text-amber-400'
    case 'UNSATISFACTORY':
    case 'NOT_PASSED':
      return 'text-red-600 dark:text-red-400'
    case 'PASSED':
      return 'text-emerald-600 dark:text-emerald-400'
  }
}

export function nationalGradeBadgeVariant(
  grade: NationalGrade,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (grade) {
    case 'EXCELLENT':
    case 'PASSED':
      return 'default'
    case 'GOOD':
      return 'secondary'
    case 'SATISFACTORY':
      return 'outline'
    case 'UNSATISFACTORY':
    case 'NOT_PASSED':
      return 'destructive'
  }
}

export function toNationalGradePreview(
  grade: number,
  scale: GradeScale,
): NationalGrade {
  if (scale === 'TWELVE_POINT') {
    if (grade >= 10) return 'EXCELLENT'
    if (grade >= 7) return 'GOOD'
    if (grade >= 4) return 'SATISFACTORY'
    return 'UNSATISFACTORY'
  }
  if (grade >= 5) return 'EXCELLENT'
  if (grade >= 4) return 'GOOD'
  if (grade >= 3) return 'SATISFACTORY'
  return 'UNSATISFACTORY'
}
