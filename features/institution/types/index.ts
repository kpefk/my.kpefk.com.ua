// ─── University DTO (mirror of backend University model, без `raw`) ───────────

export interface UniversityDto {
  id: string
  universityId: number
  code: string | null

  name: string | null
  shortName: string | null
  nameEn: string | null
  shortNameEn: string | null
  edrpou: string | null

  registrationDate: string | null
  universityTypeName: string | null
  educationType: string | null
  juristicalType: string | null
  finansingType: string | null
  governanceType: string | null
  orgPravForm: string | null
  riskRank: string | null

  isClosed: boolean
  closeStatusTypeName: string | null
  closeReason: string | null
  closeDate: string | null
  isMilitaryChair: boolean

  postIndex: string | null
  katottgFullName: string | null
  addressStreet: string | null
  houseNumber: string | null

  postIndexLegal: string | null
  katottgFullNameU: string | null
  addressStreetLegal: string | null
  houseNumberLegal: string | null

  phoneNumber: string | null
  email: string | null
  webSite: string | null

  rectorFullName: string | null
  rectorLastName: string | null
  rectorFirstName: string | null
  rectorMiddleName: string | null
  rectorFullNameGenCase: string | null
  rectorPosition: string | null
  rectorPhone: string | null
  rectorEmail: string | null
  rectorWorkDateStart: string | null
  rectorWorkDateFinish: string | null

  syncedAt: string
  createdAt: string
  updatedAt: string
}

export interface UniversitySyncResult {
  universityId: number
  name: string | null
  syncedAt: string
}

/** Складає повну адресу з частин (індекс, КАТОТТГ, вулиця, будинок). */
export function formatAddress(
  postIndex: string | null,
  katottg: string | null,
  street: string | null,
  house: string | null,
): string {
  const tail = [street, house].filter(Boolean).join(', ')
  return [postIndex, katottg, tail].filter(Boolean).join(', ')
}
