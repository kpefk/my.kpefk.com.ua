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
  USERS: {
    PROFILE: '/users/profile',
    BY_ID: (id: string) => `/users/by-id/${id}`,
    CHANGE_PASSWORD: '/users/profile/change-password',
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
  },
  EDBO: {
    SYNC_STUDENTS: '/edbo/sync/students',
    SYNC_STAFF: '/edbo/sync/staff',
    SYNC_ALL: '/edbo/sync/all',
    SYNC_STUDY_PROGRAMS: '/edbo/sync/study-programs',
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

    // Components
    COMPONENTS: (sectionId: string) => `/curriculum-sections/${sectionId}/components`,
    COMPONENT: (componentId: string) => `/curriculum-components/${componentId}`,

    // Component terms
    COMPONENT_TERMS: (componentId: string) => `/curriculum-components/${componentId}/terms`,
    COMPONENT_TERM: (termId: string) => `/curriculum-component-terms/${termId}`,

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
    WORKING_ASSIGNMENTS: '/working-curricula/group-assignments',
    GROUP_WORKING_CURRICULA: (groupId: string) => `/working-curricula/by-group/${groupId}`,
  },
} as const
