/**
 * Returns the current Ukrainian academic year string (e.g. '2025-2026').
 * The academic year starts in September.
 */
export function getCurrentAcademicYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 1-based
  const startYear = month >= 9 ? year : year - 1
  return `${startYear}-${startYear + 1}`
}

/**
 * Returns the next academic year string (e.g. '2026-2027').
 * Per §1.9 / §3.2 of the KPEFK elective regulations, students choose
 * elective components for the NEXT academic year.
 */
export function getNextAcademicYear(): string {
  const startYear = Number(getCurrentAcademicYear().slice(0, 4)) + 1
  return `${startYear}-${startYear + 1}`
}
