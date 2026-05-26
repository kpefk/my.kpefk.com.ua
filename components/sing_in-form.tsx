"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { login } from "@/lib/mock-auth"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"

export function SignInForm({ className, ...props }: React.ComponentProps<"form">) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      setLoading(true)
      await new Promise((r) => setTimeout(r, 400))
      // TODO: replace with POST /api/auth/sign-in
      const user = login(value.email, value.password)
      setLoading(false)
      if (!user) {
        toast.error("Невірний email або пароль")
        return
      }
      toast.success(`Вхід успішний! Ласкаво просимо, ${user.name.split(" ")[0]}`)
      router.push("/dashboard")
    },
  })

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
      {...props}
    >
      <FieldGroup className="flex flex-col gap-3">

        <div className="flex flex-col items-center gap-1 text-center mb-1">
          <h1 className="text-2xl font-bold">Вхід в систему</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Введіть ваш email нижче, щоб увійти в систему
          </p>
        </div>

        {/* Demo hint */}
        <div className="rounded-xl bg-kpefk-light px-3.5 py-3 text-xs text-kpefk space-y-0.5">
          <p className="font-semibold">Тестовий доступ:</p>
          <p>student@kpefk.com.ua · пароль: <span className="font-mono font-semibold">demo</span></p>
        </div>

        <form.Field name="email">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>
                Email <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                type="email"
                placeholder="my@kpefk.com.ua"
                autoComplete="email"
                required
                className="bg-background"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </Field>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor={field.name}>
                  Пароль <span className="text-destructive">*</span>
                </FieldLabel>
                <Link
                  href="/forgot-password"
                  className="text-sm underline-offset-4 hover:underline text-muted-foreground"
                >
                  Забули пароль?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id={field.name}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
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

        <Button type="submit" className="w-full bg-kpefk hover:bg-kpefk/90 text-kpefk-foreground" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Увійти"}
        </Button>

        <FieldSeparator>або продовжити з</FieldSeparator>

        <Button
          variant="outline"
          type="button"
          className="w-full"
          onClick={() => toast.info("Google OAuth — скоро буде доступно")}
        >
          <Image src="/google.svg" alt="Google" width={16} height={16} />
          Увійти через Google
        </Button>

        <FieldDescription className="text-center text-sm">
          Не маєте облікового запису?{" "}
          <Link href="/sign-up" className="underline underline-offset-4 hover:text-foreground transition-colors text-kpefk">
            Зареєструватися
          </Link>
        </FieldDescription>

      </FieldGroup>
    </form>
  )
}
