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
  },
} as const
