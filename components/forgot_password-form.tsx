"use client"

import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { Loader2, MailCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export function ForgotPasswordForm({ className, ...props }: React.ComponentProps<"form">) {
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { email: "" },
    onSubmit: async ({ value }) => {
      setLoading(true)
      // TODO: replace with POST /api/auth/forgot-password
      await new Promise((r) => setTimeout(r, 700))
      setLoading(false)
      setSentTo(value.email)
    },
  })

  if (sentTo) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center">
          <MailCheck size={28} className="text-primary" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold">Лист надіслано</h1>
          <p className="text-sm text-muted-foreground text-balance">
            Інструкції з відновлення пароля надіслано на{" "}
            <span className="font-medium text-foreground">{sentTo}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Не знайшли листа? Перевірте папку «Спам».
          </p>
        </div>
        <Link
          href="/sign-in"
          className="text-sm underline underline-offset-4 hover:text-foreground transition-colors text-primary"
        >
          Повернутись до входу
        </Link>
      </div>
    )
  }

  return (
    <form
      className={cn("flex flex-col gap-4", className)}
      onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
      {...props}
    >
      <FieldGroup className="flex flex-col gap-3">

        <div className="flex flex-col items-center gap-1 text-center mb-1">
          <h1 className="text-2xl font-bold">Відновлення пароля</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Введіть ваш email, щоб отримати інструкції по відновленню пароля
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

        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Відновити пароль"}
        </Button>

        <FieldDescription className="text-center text-sm">
          Згадали пароль?{" "}
          <Link href="/sign-in" className="underline underline-offset-4 hover:text-foreground transition-colors text-primary">
            Повернутись до входу
          </Link>
        </FieldDescription>

      </FieldGroup>
    </form>
  )
}
