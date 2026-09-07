'use client'

import { useState } from 'react'
import { Loader2, UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { USER_ROLE_LABELS, type UserRole } from '@/lib/types/user-role.types'

import { useCreateUser, useUnlinkedStudents, useUnlinkedTeachers } from '../api'
import { Combobox, toStudentOptions, toTeacherOptions } from './combobox'

const ALL_ROLES = Object.entries(USER_ROLE_LABELS) as [UserRole, string][]

// ─── Dialog ──────────────────────────────────────────────────────────────────

export function CreateUserDialog() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('STUDENT')
  const [studentId, setStudentId] = useState('')
  const [teacherId, setTeacherId] = useState('')

  const isStudent = role === 'STUDENT'
  const isTeacher = role === 'TEACHER'

  const { data: students = [], isFetching: studentsLoading } = useUnlinkedStudents(open && isStudent)
  const { data: teachers = [], isFetching: teachersLoading } = useUnlinkedTeachers(open && !isStudent)

  const createUser = useCreateUser()

  const handleRoleChange = (v: string) => {
    setRole(v as UserRole)
    setStudentId('')
    setTeacherId('')
  }

  const reset = () => {
    setEmail('')
    setRole('STUDENT')
    setStudentId('')
    setTeacherId('')
  }

  const isSubmitDisabled =
    !email.trim() ||
    (isStudent && !studentId) ||
    (isTeacher && !teacherId) ||
    createUser.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitDisabled) return
    createUser.mutate(
      {
        email: email.trim(),
        role,
        ...(isStudent && studentId ? { studentId } : {}),
        ...(teacherId ? { teacherId } : {}),
      },
      {
        onSuccess: () => {
          setOpen(false)
          reset()
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <Button className="gap-2 shrink-0">
          <UserPlus size={16} />
          Додати користувача
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Новий користувач</DialogTitle>
          <DialogDescription>
            Буде створено акаунт з тимчасовим паролем. Пароль надсилається на вказаний email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <Field>
            <FieldLabel htmlFor="new-user-email">
              Email <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="new-user-email"
              type="email"
              placeholder="user@kpefk.com.ua"
              autoComplete="off"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="new-user-role">
              Роль <span className="text-destructive">*</span>
            </FieldLabel>
            <Select value={role} onValueChange={handleRoleChange}>
              <SelectTrigger id="new-user-role" className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {isStudent && (
            <Field>
              <FieldLabel>
                Студент <span className="text-destructive">*</span>
              </FieldLabel>
              <Combobox
                options={toStudentOptions(students)}
                value={studentId}
                onChange={setStudentId}
                placeholder="Пошук за ПІБ або групою…"
                emptyText="Всі студенти вже мають акаунти"
                loading={studentsLoading}
                required
              />
            </Field>
          )}

          {!isStudent && (
            <Field>
              <FieldLabel>
                Викладач{' '}
                {isTeacher
                  ? <span className="text-destructive">*</span>
                  : <span className="text-muted-foreground text-xs font-normal">(необов'язково)</span>
                }
              </FieldLabel>
              <Combobox
                options={toTeacherOptions(teachers)}
                value={teacherId}
                onChange={setTeacherId}
                placeholder="Пошук за прізвищем або посадою…"
                emptyText="Всі викладачі вже мають акаунти"
                loading={teachersLoading}
                required={isTeacher}
                clearable={!isTeacher}
              />
            </Field>
          )}

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Скасувати
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {createUser.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Створити'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
