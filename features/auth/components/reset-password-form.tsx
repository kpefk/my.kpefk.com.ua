'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from '@tanstack/react-form'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { passwordRecoveryService } from '@/lib/services'

export function ResetPasswordForm({ className, ...props }: React.ComponentProps<'form'>) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [error, setError] = useState<string | null>(null)
  const [tokenInvalid, setTokenInvalid] = useState(false)

  useEffect(() => {
    if (!success) return
    const nav = setTimeout(() => router.push('/sign-in'), 3000)
    const interval = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => {
      clearTimeout(nav)
      clearInterval(interval)
    }
  }, [success, router])

  const form = useForm({
    defaultValues: { password: '', confirm_password: '' },
    onSubmit: async ({ value }) => {
      if (value.password !== value.confirm_password) {
        setError('Паролі не співпадають')
        return
      }
      if (!token) return
      setLoading(true)
      setError(null)
      try {
        await passwordRecoveryService.new({ password: value.password }, token)
        setSuccess(true)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Сталася помилка'
        if (msg.toLowerCase().includes('токен') || msg.toLowerCase().includes('token')) {
          setTokenInvalid(true)
        } else {
          setError(msg)
        }
      } finally {
        setLoading(false)
      }
    },
  })

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold">Невалідне посилання</h1>
          <p className="text-sm text-muted-foreground text-balance">
            Посилання для відновлення пароля відсутнє або некоректне.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="text-sm underline underline-offset-4 hover:text-foreground transition-colors text-primary"
        >
          Запросити новий лист
        </Link>
      </div>
    )
  }

  if (tokenInvalid) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold">Посилання застаріло</h1>
          <p className="text-sm text-muted-foreground text-balance">
            Це посилання для відновлення пароля вже недійсне або прострочене.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="text-sm underline underline-offset-4 hover:text-foreground transition-colors text-primary"
        >
          Запросити новий лист
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <ShieldCheck size={28} className="text-primary" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold">Пароль змінено</h1>
          <p className="text-sm text-muted-foreground text-balance">
            Ваш пароль успішно змінено. Перехід до входу через{' '}
            <span className="font-medium text-foreground">{countdown}</span> сек.
          </p>
        </div>
        <Link
          href="/sign-in"
          className="text-sm underline underline-offset-4 hover:text-foreground transition-colors text-primary"
        >
          Перейти до входу зараз
        </Link>
      </div>
    )
  }

  return (
    <form
      className={cn('flex flex-col gap-4', className)}
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      {...props}
    >
      <FieldGroup className="flex flex-col gap-3">
        <div className="flex flex-col items-center gap-1 text-center mb-1">
          <h1 className="text-2xl font-bold">Скидання пароля</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Придумайте новий пароль для вашого облікового запису
          </p>
        </div>

        <form.Field
          name="password"
          validators={{
            onBlur: ({ value }) =>
              value.length > 0 && value.length < 6
                ? 'Пароль повинен містити не менше 6 символів'
                : undefined,
          }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>
                Новий пароль <span className="text-destructive">*</span>
              </FieldLabel>
              <div className="relative">
                <Input
                  id={field.name}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="bg-background pr-10"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    field.handleChange(e.target.value)
                    setError(null)
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Приховати пароль' : 'Показати пароль'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <FieldError
                errors={field.state.meta.errors
                  .filter(Boolean)
                  .map((e) => ({ message: String(e) }))}
              />
            </Field>
          )}
        </form.Field>

        <form.Field
          name="confirm_password"
          validators={{
            onBlur: ({ value }) =>
              value.length > 0 && value !== form.state.values.password
                ? 'Паролі не співпадають'
                : undefined,
          }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>
                Підтвердити пароль <span className="text-destructive">*</span>
              </FieldLabel>
              <div className="relative">
                <Input
                  id={field.name}
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="bg-background pr-10"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    field.handleChange(e.target.value)
                    setError(null)
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirm ? 'Приховати пароль' : 'Показати пароль'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <FieldError
                errors={field.state.meta.errors
                  .filter(Boolean)
                  .map((e) => ({ message: String(e) }))}
              />
            </Field>
          )}
        </form.Field>

        {error && <FieldError>{error}</FieldError>}

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={loading}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Скинути пароль'}
        </Button>

        <FieldDescription className="text-center text-sm">
          Згадали пароль?{' '}
          <Link
            href="/sign-in"
            className="underline underline-offset-4 hover:text-foreground transition-colors text-primary"
          >
            Повернутись до входу
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
