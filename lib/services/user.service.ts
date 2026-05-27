import { api } from '@/lib/api/axios'
import type { UserDto } from '@/lib/services'

export const userService = {
  getProfile(): Promise<UserDto> {
    return api.get<UserDto>('/users/profile').then((r) => r.data)
  },
}