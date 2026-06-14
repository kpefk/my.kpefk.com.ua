import { Suspense } from 'react'
import type { Metadata } from 'next'

import { SignInForm } from '@/features/auth/components/sign-in-form'

export const metadata: Metadata = {
  title: 'Вхід',
  robots: { index: false },
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  )
}
