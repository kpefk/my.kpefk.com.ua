"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth.store"

/**
 * /profile — перенаправляє на власний профіль /profile/[id].
 * AuthGuard гарантує, що user та isHydrated вже доступні при рендері.
 * Також обробляє редірект підтвердження зміни email (?email=changed|error).
 */
export default function OwnProfileRedirectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const isHydrated = useAuthStore((s) => s.isHydrated)

  useEffect(() => {
    const emailStatus = searchParams.get("email")
    if (emailStatus === "changed") {
      toast.success("Email успішно змінено. Увійдіть з новою адресою за потреби.")
    } else if (emailStatus === "error") {
      toast.error("Не вдалося підтвердити зміну email. Посилання недійсне або прострочене.")
    }
  }, [searchParams])

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
