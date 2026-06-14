import { Suspense } from 'react'
import type { Metadata } from 'next'

import { ResetPasswordForm } from '@/features/auth/components/reset-password-form'

export const metadata: Metadata = {
  title: 'Новий пароль',
  robots: { index: false },
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
