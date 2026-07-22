export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    REFRESH: '/auth/refresh',
  },
  PASSWORD_RECOVERY: {
    RESET: '/auth/password-recovery/reset',
    NEW: (token: string) => `/auth/password-recovery/new/${token}`,
  },
  TWO_FA: {
    STATUS: '/auth/2fa/status',
    TOTP_SETUP: '/auth/2fa/totp/setup',
    TOTP_VERIFY_SETUP: '/auth/2fa/totp/verify-setup',
    TOTP_DISABLE: '/auth/2fa/totp/disable',
    EMAIL_ENABLE: '/auth/2fa/email/enable',
    EMAIL_DISABLE: '/auth/2fa/email/disable',
    ADMIN_RESET: (userId: string) => `/users/${userId}/2fa/reset`,
  },
  USERS: {
    PROFILE: '/users/profile',
    BY_ID: (id: string) => `/users/by-id/${id}`,
    CHANGE_PASSWORD: '/users/profile/change-password',
    REQUEST_EMAIL_CHANGE: '/users/profile/email',
    RESET_PASSWORD: (id: string) => `/users/${id}/reset-password`,
  },
  ADMIN: {
    USERS: '/admin/users',
    USER: (id: string) => `/admin/users/${id}`,
    UNLINKED_STUDENTS: '/admin/unlinked-students',
    UNLINKED_TEACHERS: '/admin/unlinked-teachers',
  },
  CLASSROOMS: {
    LIST: '/classrooms',
    MY: '/classrooms/my',
    BY_ID: (id: string) => `/classrooms/${id}`,
    PHOTOS: (id: string) => `/classrooms/${id}/photos`,
    PHOTO_DELETE: (id: string, googleFileId: string) => `/classrooms/${id}/photos/${googleFileId}`,
    PHOTOS_REORDER: (id: string) => `/classrooms/${id}/photos/reorder`,
    PASSPORT: (id: string) => `/classrooms/${id}/passport`,
  },
  ENTRANCE: {
    CANCELLATION: {
      LIST: '/entrance/cancellation/list',
      ADD: '/entrance/cancellation/add',
      UPDATE: '/entrance/cancellation/update',
      DELETE: '/entrance/cancellation/del',
    },
    ENROLL_ORDER: {
      LIST: '/entrance/enrollOrder/list',
      GET: '/entrance/enrollOrder/get',
    },
    EXAMINATION: {
      ADD: '/entrance/examination/add',
      CHECK: '/entrance/examination/check',
      DELETE: '/entrance/examination/del',
    },
    PERSON_REQUEST: {
      CATEGORY_LIST: '/entrance/personRequest/category/list',
    },
  },
  STUDENTS: {
    LIST: '/students',
  },
  GROUPS: {
    LIST: '/groups',
    BY_ID: (id: string) => `/groups/${id}`,
    ASSIGN_CURATOR: (id: string) => `/groups/${id}/curator`,
  },
  STAFF: {
    LIST: '/staff',
    QUALIFICATION_UPGRADES: (teacherId: string) => `/staff/${teacherId}/qualification-upgrades`,
    ATTESTATIONS: (teacherId: string) => `/staff/${teacherId}/attestations`,
    ATTESTATION_ITEM: (teacherId: string, id: string) => `/staff/${teacherId}/attestations/${id}`,
    ATTESTATIONS_DUE: '/attestations/due',
  },
  ELECTIVES: {
    CATALOG: '/electives/catalog',
    SELECT: '/electives/select',
    CANCEL_SELECT: (id: string) => `/electives/select/${id}`,
    MY: '/electives/my',
    GROUP_STATS: (groupId: string) => `/electives/group/${groupId}/stats`,
    ADMIN_CATALOG: '/electives/admin/catalog',
    ADMIN_CATALOG_ITEM: (id: string) => `/electives/admin/catalog/${id}`,
    ADMIN_CATALOG_STATUS: (id: string) => `/electives/admin/catalog/${id}/status`,
    ADMIN_CATALOG_CLONE: '/electives/admin/catalog/clone',
    ADMIN_CURRICULUM_TERMS: '/electives/admin/curriculum-terms',
    ADMIN_ASSIGN: '/electives/admin/assign',
    ADMIN_CONFIRM_ALL: '/electives/admin/confirm-all',
    ADMIN_ENROLLMENT_LIST: '/electives/admin/enrollment-list',
    ADMIN_UNSELECTED: '/electives/admin/unselected',
    // New architecture
    BLOCKS: '/electives/blocks',
    SELECTIONS: '/electives/selections',
    SELECTION: (id: string) => `/electives/selections/${id}`,
    MY_SELECTIONS: '/electives/my-selections',
    ADMIN_SEASONS: '/electives/admin/seasons',
    ADMIN_SEASON: (id: string) => `/electives/admin/seasons/${id}`,
    ADMIN_SEASON_STATUS: (id: string) => `/electives/admin/seasons/${id}/status`,
    ADMIN_SEASON_OFFERINGS: (seasonId: string) => `/electives/admin/seasons/${seasonId}/offerings`,
    ADMIN_OFFERING: (id: string) => `/electives/admin/offerings/${id}`,
    ADMIN_BLOCKS: '/electives/admin/blocks',
    ADMIN_BLOCK_COMPONENTS: (blockId: string) => `/electives/admin/blocks/${blockId}/components`,
    ADMIN_AUTO_ASSIGN_BULK: (seasonId: string) => `/electives/admin/seasons/${seasonId}/auto-assign`,
    ADMIN_SELECTIONS_V2: '/electives/admin/selections',
    ADMIN_CONFIRM_SELECTIONS: '/electives/admin/confirm-selections',
    ADMIN_GROUP_STATS_V2: (groupId: string) => `/electives/admin/group/${groupId}/stats-v2`,
    ADMIN_ENROLLMENT_LIST_V2: '/electives/admin/enrollment-list-v2',
    ADMIN_UNSELECTED_V2: '/electives/admin/unselected-v2',
    // Campaigns (річні кампанії вибору ВК)
    MY_BLOCKS: '/electives/my-blocks',
    ADMIN_CAMPAIGNS: '/electives/admin/campaigns',
    ADMIN_CAMPAIGN: (id: string) => `/electives/admin/campaigns/${id}`,
    ADMIN_CAMPAIGN_STATUS: (id: string) => `/electives/admin/campaigns/${id}/status`,
    ADMIN_CAMPAIGN_GENERATE: (id: string) => `/electives/admin/campaigns/${id}/generate`,
    ADMIN_CAMPAIGN_PROGRESS: (id: string) => `/electives/admin/campaigns/${id}/progress`,
    ADMIN_GROUP_CONFIRM: (seasonId: string, groupId: string) =>
      `/electives/admin/seasons/${seasonId}/groups/${groupId}/confirm`,
    // Print data (Додатки Положення)
    ADMIN_APPENDIX2: '/electives/admin/appendix2',
    ADMIN_APPENDIX3: '/electives/admin/appendix3',
    // ECTS threshold validation
    ADMIN_VALIDATE_THRESHOLD: '/electives/admin/validate-threshold',
  },
  INDIVIDUAL_PLANS: {
    BY_STUDENT: '/individual-plans/by-student',
    BY_GROUP: '/individual-plans/by-group',
    CREATE: '/individual-plans',
    GENERATE_FOR_GROUP: '/individual-plans/generate-for-group',
    BY_ID: (id: string) => `/individual-plans/${id}`,
    APPROVE: (id: string) => `/individual-plans/${id}/approve`,
    ADD_ITEM: (planId: string) => `/individual-plans/${planId}/items`,
    UPDATE_ITEM: (itemId: string) => `/individual-plans/items/${itemId}`,
    DELETE_ITEM: (itemId: string) => `/individual-plans/items/${itemId}`,
  },
  GROUP_LEADER: {
    MY_GROUPS: '/group-leader/my-groups',
    GROUP_STUDENTS: (groupId: string) => `/group-leader/${groupId}/students`,
    STUDENT: (groupId: string, studentId: string) =>
      `/group-leader/${groupId}/students/${studentId}`,
    PARENT_INFO: (groupId: string, studentId: string) =>
      `/group-leader/${groupId}/students/${studentId}/parent-info`,
    EXPORT: (groupId: string) => `/group-leader/${groupId}/export`,
    // Admin (HEAD_OF_DEPARTMENT+) — no groupId needed
    ADMIN_PARENT_INFO: (studentId: string) => `/students/${studentId}/parent-info`,
  },
  EDBO: {
    SYNC_STUDENTS: '/edbo/sync/students',
    SYNC_STAFF: '/edbo/sync/staff',
    SYNC_ALL: '/edbo/sync/all',
    SYNC_STUDY_PROGRAMS: '/edbo/sync/study-programs',
    SYNC_UNIVERSITY: '/edbo/sync/university',
  },
  UNIVERSITY: {
    INFO: '/university',
  },
  CURRICULUM: {
    // Specialties
    SPECIALTIES: '/specialties',
    SPECIALTY: (id: string) => `/specialties/${id}`,
    SPECIALTY_DEACTIVATE: (id: string) => `/specialties/${id}/deactivate`,

    // Educational programs
    PROGRAMS: '/educational-programs',
    PROGRAM: (id: string) => `/educational-programs/${id}`,
    PROGRAM_DEACTIVATE: (id: string) => `/educational-programs/${id}/deactivate`,

    // Curricula
    CURRICULA: '/curricula',
    CURRICULUM: (id: string) => `/curricula/${id}`,
    CURRICULUM_VERSIONS: (id: string) => `/curricula/${id}/versions`,

    // Import from Excel
    IMPORT_PREVIEW: '/curricula/import/preview',
    IMPORT_COMMIT: '/curricula/import/commit',

    // Curriculum versions
    VERSION_CREATE: (curriculumId: string) => `/curricula/${curriculumId}/versions`,
    VERSION: (id: string) => `/curriculum-versions/${id}`,
    VERSION_PUBLISH: (id: string) => `/curriculum-versions/${id}/publish`,
    VERSION_DEPRECATE: (id: string) => `/curriculum-versions/${id}/deprecate`,
    VERSION_DUPLICATE: (sourceId: string, targetCurriculumId: string) =>
      `/curriculum-versions/${sourceId}/duplicate-into/${targetCurriculumId}`,

    // Sections
    SECTIONS: (versionId: string) => `/curriculum-versions/${versionId}/sections`,
    SECTION: (sectionId: string) => `/curriculum-sections/${sectionId}`,

    // Elective blocks
    ELECTIVE_BLOCKS: (sectionId: string) => `/curriculum-sections/${sectionId}/elective-blocks`,
    ELECTIVE_BLOCK: (id: string) => `/elective-blocks/${id}`,

    // Components
    COMPONENTS: (sectionId: string) => `/curriculum-sections/${sectionId}/components`,
    COMPONENT: (componentId: string) => `/curriculum-components/${componentId}`,

    // Component terms
    COMPONENT_TERMS: (componentId: string) => `/curriculum-components/${componentId}/terms`,
    COMPONENT_TERM: (termId: string) => `/curriculum-component-terms/${termId}`,

    // Component display projections
    COMPONENT_PROJECTIONS: (versionId: string) =>
      `/curriculum-versions/${versionId}/component-projections`,
    COMPONENT_PROJECTION: (projectionId: string) =>
      `/curriculum-component-projections/${projectionId}`,

    // Time budget
    TIME_BUDGET: (versionId: string) => `/curriculum-versions/${versionId}/time-budget`,
    TIME_BUDGET_ENTRY: (entryId: string) => `/time-budget-entries/${entryId}`,

    // Academic calendar
    CALENDAR: (versionId: string) => `/curriculum-versions/${versionId}/calendar`,
    CALENDAR_ENTRY: (entryId: string) => `/academic-calendar-entries/${entryId}`,

    // Group curriculum assignments
    GROUP_ASSIGNMENTS: '/group-curriculum-assignments',
    GROUP_ASSIGNMENT_CLOSE: (id: string) => `/group-curriculum-assignments/${id}/close`,
    GROUP_ACTIVE_ASSIGNMENT: (groupId: string) =>
      `/group-curriculum-assignments/by-group/${groupId}/active`,
    GROUP_ASSIGNMENT_HISTORY: (groupId: string) =>
      `/group-curriculum-assignments/by-group/${groupId}/history`,

    // Working curricula
    WORKING_CURRICULA: '/working-curricula',
    WORKING_CURRICULUM: (id: string) => `/working-curricula/${id}`,
    WORKING_CURRICULUM_APPROVE: (id: string) => `/working-curricula/${id}/approve`,
    WORKING_CURRICULUM_TERMS: (id: string) => `/working-curricula/${id}/component-terms`,
    WORKING_CURRICULUM_INITIALIZE_TERMS: (id: string) => `/working-curricula/${id}/initialize-terms`,
    WORKING_COMPONENT_TERM: (termId: string) => `/working-component-terms/${termId}`,
    WORKING_ASSIGNMENTS: '/working-curricula/group-assignments',
    GROUP_WORKING_CURRICULA: (groupId: string) => `/working-curricula/by-group/${groupId}`,
  },
  TEACHER_LOAD: {
    MY: '/teacher-load/my',
    BY_ALL_TEACHERS: '/teacher-load/by-all-teachers',
    BY_WORKING_CURRICULUM: (id: string) => `/teacher-load/by-working-curriculum/${id}`,
    BY_TEACHER: (teacherId: string) => `/teacher-load/by-teacher/${teacherId}`,
    SUBJECT_ASSIGNMENTS: '/teacher-load/subject-assignments',
    SUBJECT_ASSIGNMENTS_GENERATE: (workingCurriculumId: string) =>
      `/teacher-load/subject-assignments/generate/${workingCurriculumId}`,
    SUBJECT_ASSIGNMENT: (id: string) => `/teacher-load/subject-assignments/${id}`,
    LESSON_ASSIGNMENT: (id: string) => `/teacher-load/lesson-assignments/${id}`,
    SUBJECT_ASSIGNMENTS_CONFIRM: '/teacher-load/subject-assignments/confirm',
    SUBJECT_ASSIGNMENTS_REVOKE: '/teacher-load/subject-assignments/revoke',
    DISTRIBUTION_MODE: '/teacher-load/distribution-mode',
    DIPLOMA_SUPERVISION: '/teacher-load/diploma-supervision',
    DIPLOMA_SUPERVISION_ITEM: (id: string) => `/teacher-load/diploma-supervision/${id}`,
  },
  SCHEDULE: {
    BASE: '/schedule',
    ALL: '/schedule/all',
    ELIGIBLE_GROUPS: '/schedule/eligible-groups',
    AVAILABLE_SUBJECTS: '/schedule/available-subjects',
    GENERATE: '/schedule/generate',
    GENERATE_ALL: '/schedule/generate-all',
    ENTRIES: '/schedule/entries',
    ENTRIES_SWAP: '/schedule/entries/swap',
    ENTRIES_MASS_REPLACE: '/schedule/entries/mass-replace',
    ENTRY: (id: string) => `/schedule/entries/${id}`,
    SETTINGS: '/schedule/settings',
    HOMEROOM: '/schedule/homeroom',
    COPY: '/schedule/copy',
    SUBSTITUTIONS: '/schedule/substitutions',
    SUBSTITUTION: (id: string) => `/schedule/substitutions/${id}`,
    BY_TEACHER: (teacherId: string) => `/schedule/by-teacher/${teacherId}`,
    BY_CLASSROOM: (classroomId: string) => `/schedule/by-classroom/${classroomId}`,
    AUDIT: (id: string) => `/schedule/${id}/audit`,
    EXPORT_ICS: '/schedule/export/ics',
    PUBLISH: (id: string) => `/schedule/${id}/publish`,
    UNPUBLISH: (id: string) => `/schedule/${id}/unpublish`,
  },
  ATTENDANCE: {
    LESSONS: '/attendance/lessons',
    SESSIONS: '/attendance/sessions',
    SESSION: (id: string) => `/attendance/sessions/${id}`,
    SESSION_RECORDS: (id: string) => `/attendance/sessions/${id}/records`,
    SESSION_CARRY_OVER: (id: string) => `/attendance/sessions/${id}/carry-over`,
    SUMMARY: '/attendance/summary',
    STUDENT_SUMMARY: (studentId: string) => `/attendance/student-summary/${studentId}`,
    JOURNAL: (componentTermId: string) => `/attendance/journal/${componentTermId}`,
  },
  GRADES: {
    RECORD: '/grades',
    BULK: '/grades/bulk',
    BY_COMPONENT_TERM: (id: string) => `/grades/by-component-term/${id}`,
    BY_STUDENT: (id: string) => `/grades/by-student/${id}`,
    RETAKE_HISTORY: '/grades/retake-history',
    MY_DISCIPLINES: '/grades/my-disciplines',
    SCALE: (componentTermId: string) => `/grades/scale/${componentTermId}`,
    VIDOMIST: (componentTermId: string) => `/grades/vidomist/${componentTermId}`,
    WEIGHT_SETTINGS: '/grades/weight-settings',
  },
  DIPLOMAS: {
    IMPORT_PREVIEW: '/diplomas/import/preview',
    IMPORT_COMMIT: '/diplomas/import/commit',
    BATCHES: '/diplomas/batches',
    BATCH_TEMPLATE: (id: string) => `/diplomas/batches/${id}/template`,
    BATCH_DELETE: (id: string) => `/diplomas/batches/${id}`,
    BATCH_SYNC_ENTRY_DOCS: (id: string) => `/diplomas/batches/${id}/sync-entry-documents`,
    GRADE_SHEET: '/diplomas/grade-sheet',
    EDBO_ACCREDITATION: '/diplomas/edbo/accreditation',
    EDBO_ACCREDITATION_SYNC: '/diplomas/edbo/accreditation/sync',
    LIST: '/diplomas',
    BY_ID: (id: string) => `/diplomas/${id}`,
    ASSIGN_TEMPLATE: (id: string) => `/diplomas/${id}/template`,
    GRADES: (id: string) => `/diplomas/${id}/grades`,
    GENERATE: (id: string) => `/diplomas/${id}/generate`,
    GENERATE_BULK: '/diplomas/generate-bulk',
  },
  RATING: {
    GROUP: (groupId: string) => `/rating/group/${groupId}`,
    GROUP_EXPORT: (groupId: string) => `/rating/group/${groupId}/export`,
    BONUS: '/rating/bonus',
  },
  SURVEYS: {
    MY: '/surveys/my',
    SUBMIT: (id: string) => `/surveys/${id}/submit`,
    LIST: '/surveys',
    BY_ID: (id: string) => `/surveys/${id}`,
    QUESTIONS: (id: string) => `/surveys/${id}/questions`,
    STATUS: (id: string) => `/surveys/${id}/status`,
    RESULTS: (id: string) => `/surveys/${id}/results`,
  },
  CREDIT_RECOGNITION: {
    LIST: '/credit-recognitions',
    BY_ID: (id: string) => `/credit-recognitions/${id}`,
    BY_STUDENT: (studentId: string) => `/credit-recognitions/students/${studentId}`,
    CONFIRM: (id: string) => `/credit-recognitions/${id}/confirm`,
    REVERT: (id: string) => `/credit-recognitions/${id}/revert`,
  },
  ACADEMIC_MOBILITY: {
    LIST: '/academic-mobility',
    BY_ID: (id: string) => `/academic-mobility/${id}`,
    BY_STUDENT: (studentId: string) => `/academic-mobility/students/${studentId}`,
    CONFIRM: (id: string) => `/academic-mobility/${id}/confirm`,
    REVERT: (id: string) => `/academic-mobility/${id}/revert`,
  },
  ADMISSIONS: {
    YEARS: '/admissions/years',
    OVERVIEW: '/admissions/overview',
    OFFERS: '/admissions/offers',
    BY_SPECIALITY: '/admissions/by-speciality',
    BY_DAY: '/admissions/by-day',
    KONKURS_DISTRIBUTION: '/admissions/konkurs-distribution',
    TRENDS: '/admissions/trends',
    APPLICATIONS: '/admissions/applications',
    APPLICATIONS_EXPORT: '/admissions/applications/export',
    SYNC: '/admissions/sync',
    ARCHIVE: (year: number) => `/admissions/${year}/archive`,
    SETTINGS: '/admissions/settings',
    OFFER_SETTINGS: (id: number) => `/admissions/offers/${id}/settings`,
    AUTO_REGISTER: '/admissions/auto-register',
  },
  DIPLOMA_TEMPLATES: {
    LIST: '/diploma-templates',
    BY_ID: (id: string) => `/diploma-templates/${id}`,
    COMPONENTS: (id: string) => `/diploma-templates/${id}/components`,
    FILE: (id: string, kind: 'diploma' | 'addendum') =>
      `/diploma-templates/${id}/files/${kind}`,
  },
} as const
