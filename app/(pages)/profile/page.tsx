"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuthStore } from "@/store/auth.store"

/**
 * /profile — перенаправляє на власний профіль /profile/[id].
 * AuthGuard гарантує, що user та isHydrated вже доступні при рендері.
 */
export default function OwnProfileRedirectPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isHydrated = useAuthStore((s) => s.isHydrated)

  useEffect(() => {
    if (isHydrated && user?.id) {
      router.replace(`/profile/${user.id}`)
    }
  }, [isHydrated, user, router])

  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="animate-spin text-muted-foreground" size={24} />
    </div>
  )
}
