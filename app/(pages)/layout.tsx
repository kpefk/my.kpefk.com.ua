'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Preloader } from '@/components/preloader'
import { useMe } from '@/features/auth/api'
import { useAuthStore } from '@/store/auth.store'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isError } = useMe()
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)

  // Sync the fetched user into Zustand so DashboardShell / Header can read it
  useEffect(() => {
    if (user) setUser(user)
  }, [user, setUser])

  // Redirect when the session is gone (logout, expired cookie, etc.)
  useEffect(() => {
    if (!isLoading && isError) {
      router.replace('/sign-in')
    }
  }, [isLoading, isError, router])

  // Always show the preloader while transitioning — never return null.
  // Returning null here causes a black screen while router.replace() is
  // in flight (e.g. right after logout clears the query cache).
  if (isLoading || isError || !user) return <Preloader />

  return <DashboardShell>{children}</DashboardShell>
}
