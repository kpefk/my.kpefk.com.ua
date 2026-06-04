export type {
  ProfileDto,
  StudentProfileDto,
  TeacherProfileDto,
} from '@/lib/services/user.service'

export interface UpdateProfileDto {
  email?: string
}

export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
}
