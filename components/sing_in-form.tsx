"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/stores/auth.store"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"

export function SignInForm({ className, ...props }: React.ComponentProps<"form">) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  const { login, isLoading, isTwoFactorRequired, twoFactorMessage } = useAuthStore()

  const form = useForm({
    defaultValues: { email: "", password: "", code: "" },
    onSubmit: async ({ value }) => {
      try {
        const result = await login({
          email: value.email,
          password: value.password,
          code: value.code || undefined,
        })

        if (result === 'two_factor') {
          toast.info(twoFactorMessage)
          return
        }

        toast.success(`Ласкаво просимо!`)
        router.push('/dashboard')

      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Помилка входу')
      }
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

        {/* ── 2FA поле ──────────────────────────────────────────── */}
        {isTwoFactorRequired && (
          <form.Field name="code">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>
                  Код підтвердження <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id={field.name}
                  type="text"
                  placeholder="000000"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                  className="bg-background tracking-widest text-center"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </Field>
            )}
          </form.Field>
        )}

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={isLoading}
        >
          {isLoading
            ? <Loader2 size={16} className="animate-spin" />
            : isTwoFactorRequired ? "Підтвердити" : "Увійти"
          }
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
          <Link
            href="/sign-up"
            className="underline underline-offset-4 hover:text-foreground transition-colors text-primary"
          >
            Зареєструватися
          </Link>
        </FieldDescription>

      </FieldGroup>
    </form>
  )
}