"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export function ResetPasswordForm({ className, ...props }: React.ComponentProps<"form">) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    defaultValues: { password: "", confirm_password: "" },
    onSubmit: async ({ value }) => {
      if (value.password !== value.confirm_password) {
        return toast.error("Паролі не співпадають")
      }
      setLoading(true)
      // TODO: replace with POST /api/auth/reset-password
      await new Promise((r) => setTimeout(r, 700))
      setLoading(false)
      toast.success("Пароль успішно змінено!")
      router.push("/sign-in")
    },
  })

  return (
    <form
      className={cn("flex flex-col gap-4", className)}
      onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
      {...props}
    >
      <FieldGroup className="flex flex-col gap-3">

        <div className="flex flex-col items-center gap-1 text-center mb-1">
          <h1 className="text-2xl font-bold">Скидання пароля</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Придумайте новий пароль для вашого облікового запису
          </p>
        </div>

        <form.Field name="password">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>
                Новий пароль <span className="text-destructive">*</span>
              </FieldLabel>
              <div className="relative">
                <Input
                  id={field.name}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="bg-background pr-10"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Приховати пароль" : "Показати пароль"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
          )}
        </form.Field>

        <form.Field name="confirm_password">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>
                Підтвердити пароль <span className="text-destructive">*</span>
              </FieldLabel>
              <div className="relative">
                <Input
                  id={field.name}
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="bg-background pr-10"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirm ? "Приховати пароль" : "Показати пароль"}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
          )}
        </form.Field>

        <Button type="submit" className="w-full bg-kpefk hover:bg-kpefk/90 text-kpefk-foreground" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Скинути пароль"}
        </Button>

        <FieldDescription className="text-center text-sm">
          Згадали пароль?{" "}
          <Link href="/sign-in" className="underline underline-offset-4 hover:text-foreground transition-colors text-kpefk">
            Повернутись до входу
          </Link>
        </FieldDescription>

      </FieldGroup>
    </form>
  )
}
