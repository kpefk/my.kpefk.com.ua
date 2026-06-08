'use client'

import { useState } from 'react'
import { KeyRound, Loader2, Mail, ShieldOff, Smartphone, UserCheck, UserX } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { USER_ROLE_COLORS, USER_ROLE_LABELS, type UserRole } from '@/lib/types/user-role.types'

import { useAdminReset2FA } from '@/features/auth/api/security'
import { useDeactivateUser, useResetPassword, useUpdateUser } from '../api'
import { formatDate, getUserDisplayName, type AdminUserDto } from '../types'

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>
    </div>
  )
}

function InfoField({ label, value, span }: { label: string; value: React.ReactNode; span?: boolean }) {
  return (
    <div className={span ? 'col-span-2' : ''}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium break-words">{value ?? '—'}</p>
    </div>
  )
}

const ALL_ROLES = Object.entries(USER_ROLE_LABELS) as [UserRole, string][]

interface UserDetailSheetProps {
  user: AdminUserDto | null
  open: boolean
  onClose: () => void
}

export function UserDetailSheet({ user, open, onClose }: UserDetailSheetProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const updateUser = useUpdateUser()
  const deactivateUser = useDeactivateUser()
  const resetPassword = useResetPassword()
  const reset2FA = useAdminReset2FA()

  if (!user) return null

  const currentRole = selectedRole ?? user.role
  const roleChanged = currentRole !== user.role

  const handleRoleChange = (role: UserRole) => setSelectedRole(role)

  const handleSaveRole = () => {
    if (!roleChanged) return
    updateUser.mutate(
      { id: user.id, data: { role: currentRole } },
      { onSuccess: () => setSelectedRole(null) }
    )
  }

  const handleDeactivate = () => {
    deactivateUser.mutate(user.id, { onSuccess: onClose })
  }

  const handleActivate = () => {
    updateUser.mutate({ id: user.id, data: { isActive: true } }, { onSuccess: onClose })
  }

  const displayName = getUserDisplayName(user)

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) { setSelectedRole(null); onClose() } }}>
      <SheetContent side="right" className="w-full sm:w-[520px] sm:max-w-[520px] flex flex-col gap-0 p-0 overflow-y-auto">

        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="text-base leading-snug font-mono">{user.email}</SheetTitle>
              {displayName !== user.email && (
                <SheetDescription className="mt-0.5">{displayName}</SheetDescription>
              )}
            </div>
            {user.isActive ? (
              <Badge className="shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100">
                Активний
              </Badge>
            ) : (
              <Badge className="shrink-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100">
                Деактивований
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 px-6 py-5 space-y-6">

          <InfoSection title="Акаунт">
            <InfoField
              label="Роль"
              value={
                <Badge className={`${USER_ROLE_COLORS[user.role]} hover:${USER_ROLE_COLORS[user.role]} mt-1`}>
                  {USER_ROLE_LABELS[user.role]}
                </Badge>
              }
            />
            <InfoField
              label="2FA"
              value={
                user.twoFactorMethod === 'TOTP'
                  ? <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><Smartphone size={14} /> Authenticator</span>
                  : user.twoFactorMethod === 'EMAIL'
                    ? <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400"><Mail size={14} /> Пошта</span>
                    : <span className="flex items-center gap-1 text-muted-foreground"><ShieldOff size={14} /> Вимкнено</span>
              }
            />
            <InfoField label="Перший вхід" value={user.isFirstLogin ? 'Ще не входив' : 'Вхід виконано'} />
            <InfoField label="Зареєстровано" value={formatDate(user.createdAt)} />
            <InfoField label="Останнє оновлення" value={formatDate(user.updatedAt)} />
          </InfoSection>

          {user.student && (
            <InfoSection title="Профіль студента">
              <InfoField label="ПІБ" value={user.student.personFIO} span />
              <InfoField label="Група" value={user.student.groupName} />
            </InfoSection>
          )}

          {user.teacher && (
            <InfoSection title="Профіль викладача">
              <InfoField
                label="ПІБ"
                value={[user.teacher.lastName, user.teacher.firstName, user.teacher.middleName].filter(Boolean).join(' ')}
                span
              />
              <InfoField label="Посада" value={user.teacher.positionName} span />
            </InfoSection>
          )}

          {/* Зміна ролі */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Змінити роль</h3>
            <div className="flex gap-2">
              <Select value={currentRole} onValueChange={(v) => handleRoleChange(v as UserRole)}>
                <SelectTrigger className="flex-1 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                disabled={!roleChanged || updateUser.isPending}
                onClick={handleSaveRole}
              >
                {updateUser.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Зберегти'}
              </Button>
            </div>
          </div>

        </div>

        <SheetFooter className="px-6 py-4 border-t border-border flex flex-col sm:flex-row gap-2 flex-wrap">
          {/* Скинути 2FA */}
          {user.twoFactorMethod !== 'NONE' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 flex-1" disabled={reset2FA.isPending}>
                  {reset2FA.isPending ? <Loader2 size={14} className="animate-spin" /> : <ShieldOff size={14} />}
                  Скинути 2FA
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Скинути двофакторну автентифікацію?</AlertDialogTitle>
                  <AlertDialogDescription>
                    2FA для <span className="font-medium text-foreground">{user.email}</span> буде вимкнено.
                    Користувач зможе повторно налаштувати її самостійно.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Скасувати</AlertDialogCancel>
                  <AlertDialogAction onClick={() => reset2FA.mutate(user.id)}>
                    Скинути
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Скинути пароль */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 flex-1" disabled={resetPassword.isPending}>
                {resetPassword.isPending ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                Скинути пароль
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Скинути пароль</AlertDialogTitle>
                <AlertDialogDescription>
                  Буде згенеровано новий тимчасовий пароль та надіслано на{' '}
                  <span className="font-medium text-foreground">{user.email}</span>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Скасувати</AlertDialogCancel>
                <AlertDialogAction onClick={() => resetPassword.mutate(user.id)}>
                  Скинути
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Активувати / Деактивувати */}
          {user.isActive ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1.5 flex-1" disabled={deactivateUser.isPending}>
                  {deactivateUser.isPending ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />}
                  Деактивувати
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Деактивувати акаунт?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Користувач <span className="font-medium text-foreground">{user.email}</span> втратить доступ до системи.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Скасувати</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeactivate} className="bg-destructive hover:bg-destructive/90">
                    Деактивувати
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 flex-1 border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              onClick={handleActivate}
              disabled={updateUser.isPending}
            >
              {updateUser.isPending ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
              Активувати
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={onClose}>Закрити</Button>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  )
}
