import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().email('Невірний формат email'),
  password: z.string().min(6, 'Мінімум 6 символів'),
  code: z.string().optional(),
})
export type SignInData = z.infer<typeof signInSchema>

export const signUpSchema = z.object({
  email: z.string().email('Невірний формат email'),
  password: z.string().min(8, 'Мінімум 8 символів'),
  consent: z.boolean(),
  rnokpp: z.string().optional(),
  no_rnokpp: z.boolean().optional(),
  serial_ticket: z.string().optional(),
  number_ticket: z.string().optional(),
  no_student_ticket: z.boolean().optional(),
  serial_passport: z.string().optional(),
  number_passport: z.string().optional(),
})
export type SignUpData = z.infer<typeof signUpSchema>

export const passwordRecoverySchema = z.object({
  email: z.string().email('Невірний формат email'),
})
export type PasswordRecoveryData = z.infer<typeof passwordRecoverySchema>

export const newPasswordSchema = z
  .object({
    password: z.string().min(8, 'Мінімум 8 символів'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Паролі не збігаються',
    path: ['confirmPassword'],
  })
export type NewPasswordData = z.infer<typeof newPasswordSchema>
