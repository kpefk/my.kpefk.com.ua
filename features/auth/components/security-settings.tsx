'use client'

import { useState } from 'react'
import { Eye, EyeOff, Loader2, Mail, Shield, ShieldCheck, ShieldOff, Smartphone } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

import { useChangePassword, useEmailEnable2FA, useGet2FAStatus } from '../api/security'
import { Disable2FADialog } from './disable-2fa-dialog'
import { TotpSetupDialog } from './totp-setup-dialog'

// ─── Method badge ─────────────────────────────────────────────────────────────

function MethodBadge({ method }: { method: string }) {
  if (method === 'EMAIL') return (
    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 gap-1">
      <Mail size={11} /> Пошта
    </Badge>
  )
  if (method === 'TOTP') return (
    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 gap-1">
      <Smartphone size={11} /> Authenticator
    </Badge>
  )
  return (
    <Badge className="bg-muted text-muted-foreground hover:bg-muted gap-1">
      <ShieldOff size={11} /> Не активовано
    </Badge>
  )
}

// ─── 2FA method card ──────────────────────────────────────────────────────────

interface MethodCardProps {
  icon: React.ReactNode
  title: string
  description: string
  isActive: boolean
  isOtherActive: boolean
  onEnable: () => void
  onDisable: () => void
  enablePending?: boolean
}

function MethodCard({
  icon,
  title,
  description,
  isActive,
  isOtherActive,
  onEnable,
  onDisable,
  enablePending,
}: MethodCardProps) {
  return (
    <div className={cn(
      'rounded-lg border p-4 flex flex-col gap-3 transition-colors',
      isActive ? 'border-emerald-500/50 bg-emerald-50/40 dark:bg-emerald-900/10' : 'border-border',
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={cn('text-muted-foreground', isActive && 'text-emerald-600 dark:text-emerald-400')}>
            {icon}
          </span>
          <div>
            <p className="text-sm font-semibold flex items-center gap-2">
              {title}
              {isActive && (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 text-[10px] px-1.5 py-0 gap-1">
                  <ShieldCheck size={10} /> Активовано
                </Badge>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
      </div>

      {isActive ? (
        <Button size="sm" variant="outline" onClick={onDisable} className="self-start text-destructive border-destructive/30 hover:bg-destructive/5">
          Вимкнути
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={onEnable}
          disabled={isOtherActive || enablePending}
          className="self-start"
          title={isOtherActive ? 'Спочатку вимкніть поточний метод' : undefined}
        >
          {enablePending ? <Loader2 size={13} className="animate-spin" /> : 'Підключити'}
        </Button>
      )}
    </div>
  )
}

// ─── Change password ──────────────────────────────────────────────────────────

function ChangePasswordForm() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const changePassword = useChangePassword()

  const mismatch = next && confirm && next !== confirm
  const canSubmit = current.length >= 1 && next.length >= 8 && next === confirm

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    changePassword.mutate(
      { currentPassword: current, newPassword: next },
      {
        onSuccess: () => {
          setCurrent(''); setNext(''); setConfirm('')
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cur-pass">Поточний пароль</Label>
        <div className="relative">
          <Input
            id="cur-pass"
            type={showCurrent ? 'text' : 'password'}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
            className="pr-10"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowCurrent((v) => !v)}
          >
            {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-pass">Новий пароль <span className="text-muted-foreground text-xs">(мін. 8 символів)</span></Label>
        <div className="relative">
          <Input
            id="new-pass"
            type={showNext ? 'text' : 'password'}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
            className="pr-10"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowNext((v) => !v)}
          >
            {showNext ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="conf-pass" className={cn(mismatch && 'text-destructive')}>
          Підтвердження пароля
        </Label>
        <Input
          id="conf-pass"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          className={cn(mismatch && 'border-destructive focus-visible:ring-destructive')}
        />
        {mismatch && <p className="text-xs text-destructive">Паролі не збігаються</p>}
      </div>

      <div className="flex justify-end mt-1">
        <Button type="submit" size="sm" disabled={!canSubmit || changePassword.isPending}>
          {changePassword.isPending ? <Loader2 size={13} className="animate-spin" /> : 'Змінити пароль'}
        </Button>
      </div>
    </form>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SecuritySettings() {
  const { data: status, isLoading } = useGet2FAStatus()
  const emailEnable = useEmailEnable2FA()

  const [totpSetupOpen, setTotpSetupOpen] = useState(false)
  const [disableOpen, setDisableOpen] = useState(false)

  const method = status?.method ?? 'NONE'
  const isEmailActive = method === 'EMAIL'
  const isTotpActive = method === 'TOTP'
  const isAnyActive = method !== 'NONE'

  return (
    <div className="flex flex-col gap-8">

      {/* ── Change password ──────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Зміна пароля</h2>
        </div>
        <ChangePasswordForm />
      </section>

      <Separator />

      {/* ── 2FA ─────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Двофакторна автентифікація</h2>
          </div>
          {!isLoading && (
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-muted-foreground" />
              <MethodBadge method={method} />
              {isAnyActive && status?.email && (
                <span className="text-xs text-muted-foreground">({status.email})</span>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
            <Loader2 size={16} className="animate-spin" /> Завантаження…
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Email method */}
            <MethodCard
              icon={<Mail size={18} />}
              title="Код на пошту"
              description={`Отримуйте одноразові коди на email${status?.email ? ` (${status.email})` : ''}`}
              isActive={isEmailActive}
              isOtherActive={isTotpActive}
              onEnable={() => emailEnable.mutate()}
              onDisable={() => setDisableOpen(true)}
              enablePending={emailEnable.isPending}
            />

            {/* TOTP method */}
            <MethodCard
              icon={<Smartphone size={18} />}
              title="Google Authenticator"
              description="Використовуйте застосунок-автентифікатор (Google Authenticator, Authy)"
              isActive={isTotpActive}
              isOtherActive={isEmailActive}
              onEnable={() => setTotpSetupOpen(true)}
              onDisable={() => setDisableOpen(true)}
            />
          </div>
        )}
      </section>

      {/* ── Dialogs ──────────────────────────────────────────────────── */}
      <TotpSetupDialog open={totpSetupOpen} onClose={() => setTotpSetupOpen(false)} />
      {isAnyActive && (
        <Disable2FADialog
          open={disableOpen}
          onClose={() => setDisableOpen(false)}
          method={method as 'EMAIL' | 'TOTP'}
        />
      )}
    </div>
  )
}
