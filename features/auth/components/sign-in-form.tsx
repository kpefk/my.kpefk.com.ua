'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from '@tanstack/react-form'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'

import { useLogin } from '../api'

const OAUTH_ERRORS: Record<string, string> = {
  account_not_found: 'Акаунт з цим Google-обліковим записом не знайдено. Зверніться до адміністратора.',
  account_inactive: 'Ваш акаунт деактивовано. Зверніться до адміністратора.',
  oauth_failed: 'Помилка авторизації через Google. Спробуйте ще раз.',
}

const GOOGLE_OAUTH_URL = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/auth/oauth/connect/google`

export function SignInForm({ className, ...props }: React.ComponentProps<'form'>) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const { isTwoFactorRequired, twoFactorMessage } = useAuthStore()
  const login = useLogin()

  // Показуємо помилку якщо OAuth редірект повернув ?error=...
  useEffect(() => {
    const error = searchParams.get('error')
    if (!error) return
    toast.error(OAUTH_ERRORS[error] ?? 'Помилка авторизації через Google.')
    const url = new URL(window.location.href)
    url.searchParams.delete('error')
    window.history.replaceState({}, '', url.toString())
  }, [searchParams])

  const form = useForm({
    defaultValues: { email: '', password: '', code: '' },
    onSubmit: async ({ value }) => {
      try {
        const result = await login.mutateAsync({
          email: value.email,
          password: value.password,
          code: value.code || undefined,
        })

        if ('message' in result) return

        router.push('/dashboard')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Помилка входу')
      }
    },
  })

  return (
    <form
      className={cn('flex flex-col gap-6', className)}
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
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
              {field.state.meta.errors.length > 0 && (
                <p className="text-sm text-destructive">{String(field.state.meta.errors[0])}</p>
              )}
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
                  type={showPassword ? 'text' : 'password'}
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
                  aria-label={showPassword ? 'Приховати пароль' : 'Показати пароль'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {field.state.meta.errors.length > 0 && (
                <p className="text-sm text-destructive">{String(field.state.meta.errors[0])}</p>
              )}
            </Field>
          )}
        </form.Field>

        {isTwoFactorRequired && (
          <div className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary leading-snug">
            {twoFactorMessage}
          </div>
        )}

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
          disabled={login.isPending}
        >
          {login.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isTwoFactorRequired ? (
            'Підтвердити'
          ) : (
            'Увійти'
          )}
        </Button>

        <FieldSeparator>або продовжити з</FieldSeparator>

        <Button
          variant="outline"
          type="button"
          className="w-full"
          onClick={() => { window.location.href = GOOGLE_OAUTH_URL }}
        >
          <Image src="/google.svg" alt="Google" width={16} height={16} />
          Увійти через Google
        </Button>

        <FieldDescription className="text-center text-sm">
          Не маєте облікового запису?{' '}
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
