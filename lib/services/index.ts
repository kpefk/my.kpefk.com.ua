export { authService } from './auth.service'
export type {
  UserDto,
  LoginPayload,
  RegisterStudentPayload,
  AuthResponse,
  TwoFactorResponse,
} from './auth.service'

export { passwordRecoveryService } from './password-recovery.service'
export type {
  ResetPasswordPayload,
  NewPasswordPayload,
} from './password-recovery.service'

export { userService } from './user.service'
export type {
  ProfileDto,
  StudentProfileDto,
  TeacherProfileDto,
} from './user.service'