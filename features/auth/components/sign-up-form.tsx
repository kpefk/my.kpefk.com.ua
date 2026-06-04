'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, useStore } from '@tanstack/react-form'
import { Eye, EyeOff, Info, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import { useRegister } from '../api'

export function SignUpForm({ className, ...props }: React.ComponentProps<'form'>) {
  const router = useRouter()
  const [noRnokpp, setNoRnokpp] = useState(false)
  const [noStudentTicket, setNoStudentTicket] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const register = useRegister()

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      rnokpp: '',
      no_rnokpp: false,
      serial_ticket: '',
      number_ticket: '',
      no_student_ticket: false,
      serial_passport: '',
      number_passport: '',
      consent: false,
    },
    onSubmit: async ({ value }) => {
      try {
        await register.mutateAsync({
          email: value.email,
          password: value.password,
          consent: value.consent,
          rnokpp: value.rnokpp || undefined,
          no_rnokpp: value.no_rnokpp,
          serial_ticket: value.serial_ticket || undefined,
          number_ticket: value.number_ticket || undefined,
          no_student_ticket: value.no_student_ticket,
          serial_passport: value.serial_passport || undefined,
          number_passport: value.number_passport || undefined,
        })

        toast.success('Акаунт створено! Ласкаво просимо.')
        router.push('/dashboard')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Помилка реєстрації')
      }
    },
  })

  const consent = useStore(form.store, (state) => state.values.consent)

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
          <h1 className="text-xl font-bold">Реєстрація електронного кабінету для студента</h1>
          <p className="text-xs text-balance text-muted-foreground">
            Заповніть форму нижче, щоб створити свій електронний кабінет студента.
          </p>
        </div>

        <form.Field name="email">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>
                Логін (адреса електронної пошти) <span className="text-destructive">*</span>
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
              <FieldLabel htmlFor={field.name}>
                Пароль <span className="text-destructive">*</span>
              </FieldLabel>
              <div className="relative">
                <Input
                  id={field.name}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Придумайте надійний пароль"
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
                  aria-label={showPassword ? 'Приховати пароль' : 'Показати пароль'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
          )}
        </form.Field>

        {!noRnokpp && (
          <form.Field name="rnokpp">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>
                  РНОКПП <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id={field.name}
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="1234567890"
                  required
                  className="bg-background"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value.replace(/\D/g, ''))}
                />
                <FieldDescription className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Info size={12} />
                  10-значний номер з картки платника податків
                </FieldDescription>
              </Field>
            )}
          </form.Field>
        )}

        <form.Field name="no_rnokpp">
          {(field) => (
            <div className="flex items-center gap-2">
              <Checkbox
                id={field.name}
                checked={field.state.value}
                onCheckedChange={(checked) => {
                  const val = checked === true
                  field.handleChange(val)
                  setNoRnokpp(val)
                }}
              />
              <label htmlFor={field.name} className="text-sm font-medium cursor-pointer">
                РНОКПП відсутній
              </label>
            </div>
          )}
        </form.Field>

        <FieldSeparator />

        {!noStudentTicket && (
          <div className="grid grid-cols-2 gap-3">
            <form.Field name="serial_ticket">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    Серія квитка <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id={field.name}
                    type="text"
                    placeholder="КВ"
                    required
                    className="bg-background"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="number_ticket">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    Номер квитка <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id={field.name}
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    required
                    className="bg-background"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </form.Field>
          </div>
        )}

        <form.Field name="no_student_ticket">
          {(field) => (
            <div className="flex items-center gap-2">
              <Checkbox
                id={field.name}
                checked={field.state.value}
                onCheckedChange={(checked) => {
                  const val = checked === true
                  field.handleChange(val)
                  setNoStudentTicket(val)
                }}
              />
              <label htmlFor={field.name} className="text-sm font-medium cursor-pointer">
                Студентський квиток відсутній
              </label>
            </div>
          )}
        </form.Field>

        {noStudentTicket && (
          <div className="grid grid-cols-2 gap-3">
            <form.Field name="serial_passport">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Серія паспорта</FieldLabel>
                  <Input
                    id={field.name}
                    type="text"
                    placeholder="АС (не для ID-картки)"
                    className="bg-background"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="number_passport">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    Номер паспорта <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id={field.name}
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    required
                    className="bg-background"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </form.Field>
          </div>
        )}

        <FieldSeparator />

        <form.Field name="consent">
          {(field) => (
            <div className="flex items-start gap-2">
              <Checkbox
                id={field.name}
                checked={field.state.value}
                onCheckedChange={(checked) => field.handleChange(checked === true)}
              />
              <label htmlFor={field.name} className="text-xs cursor-pointer leading-snug">
                Надаю згоду на обробку персональних даних згідно із Законом України{' '}
                <a
                  href="https://zakon.rada.gov.ua/laws/show/2297-17"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  «Про захист персональних даних»
                </a>
              </label>
            </div>
          )}
        </form.Field>

        <Button
          type="submit"
          disabled={!consent || register.isPending}
          className="w-full mt-1 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {register.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            'Зареєструватися'
          )}
        </Button>

        <FieldDescription className="text-xs text-muted-foreground text-center">
          Виникли проблеми з реєстрацією?{' '}
          <a
            href="mailto:my@kpefk.com.ua"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            my@kpefk.com.ua
          </a>
        </FieldDescription>

        <FieldDescription className="text-center">
          Уже маєте обліковий запис?{' '}
          <Link
            href="/sign-in"
            className="underline underline-offset-4 hover:text-foreground transition-colors text-primary"
          >
            Увійти
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
