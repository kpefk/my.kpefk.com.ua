"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Award,
  Briefcase,
  Calendar,
  Clock,
  FileText,
  GraduationCap,
  Info,
  Loader2,
  Pencil,
  ShieldOff,
  User,
  UserX,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth.store"
import {
  userService,
  type ProfileDto,
  type StudentProfileDto,
  type TeacherProfileDto,
} from "@/lib/services"
import { Button } from "@/components/ui/button"
import { USER_ROLE_LABELS, USER_ROLE_COLORS } from "@/lib/types/user-role.types"

// ── Types ──────────────────────────────────────────────────────────
type PageState =
  | { status: "loading" }
  | { status: "success"; profile: ProfileDto }
  | { status: "forbidden" }
  | { status: "not_found" }
  | { status: "error"; message: string }

// ── Utilities ──────────────────────────────────────────────────────

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    return new Intl.DateTimeFormat("uk-UA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(value))
  } catch {
    return value
  }
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase()
}

function getDisplayName(profile: ProfileDto): string {
  if (profile.teacher) {
    const { lastName, firstName, middleName } = profile.teacher
    return [lastName, firstName, middleName].filter(Boolean).join(" ") || profile.email
  }
  if (profile.student?.personFIO) {
    return profile.student.personFIO
  }
  return profile.email
}

function classifyHttpError(error: unknown): PageState {
  if (!(error instanceof Error)) return { status: "error", message: "Невідома помилка" }
  // NestJS повертає стандартні рядки "Forbidden" / "Not Found" через axios-interceptor
  if (error.message === "Forbidden") return { status: "forbidden" }
  if (error.message === "Not Found") return { status: "not_found" }
  return { status: "error", message: error.message }
}

// ── UI Primitives ──────────────────────────────────────────────────

/** Пара мітка + значення. Не рендерується, якщо value порожнє. */
function ProfileField({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  if (value === null || value === undefined || value === "") return null
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium break-words">{value}</dd>
    </div>
  )
}

/** Секція-картка з іконкою та сіткою полів. */
function ProfileSection({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        <Icon size={14} />
        {title}
      </h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
        {children}
      </dl>
    </section>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex gap-4 items-center">
          <div className="w-16 h-16 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-muted rounded-lg w-44" />
            <div className="h-4 bg-muted rounded-lg w-20" />
            <div className="h-3 bg-muted rounded-lg w-36" />
          </div>
        </div>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
          <div className="h-3 bg-muted rounded w-28" />
          <div className="grid grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className="space-y-1">
                <div className="h-2.5 bg-muted rounded w-16" />
                <div className="h-4 bg-muted rounded w-28" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Empty / Error states ───────────────────────────────────────────

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <Icon size={28} className="text-muted-foreground" />
      </div>
      <div className="space-y-1 max-w-xs">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

// ── Role-specific sections ─────────────────────────────────────────

function StudentSections({
  student,
  showSensitive,
}: {
  student: StudentProfileDto
  showSensitive: boolean
}) {
  return (
    <>
      <ProfileSection title="Навчання" icon={GraduationCap}>
        <ProfileField label="Навчальна група" value={student.groupName} />
        <ProfileField
          label="Курс"
          value={
            student.courseName ??
            (student.courseId != null ? `${student.courseId} курс` : null)
          }
        />
        <ProfileField label="Форма навчання" value={student.educationFormName} />
        <ProfileField label="Факультет / підрозділ" value={student.facultyName} />
        <ProfileField label="Спеціальність" value={student.fullSpecialityName} />
        <ProfileField label="Освітня програма" value={student.studyProgramName} />
        <ProfileField label="Кваліфікація" value={student.qualificationGroupName} />
        <ProfileField label="Профіль / спеціалізація" value={student.professionInfo} />
        <ProfileField
          label="Особливість навчання"
          value={
            student.isShortTerm
              ? "Скорочена форма"
              : student.isDualForm
              ? "Дуальна форма"
              : student.isSecondHigher
              ? "Другий вищий"
              : null
          }
        />
      </ProfileSection>

      <ProfileSection title="Зарахування" icon={Calendar}>
        <ProfileField
          label="Дата зарахування"
          value={formatDate(student.educationDateBegin)}
        />
        <ProfileField
          label="Рік набору"
          value={student.licenseYear != null ? String(student.licenseYear) : null}
        />
        {student.expelEducationTypeName && (
          <ProfileField label="Статус навчання" value={student.expelEducationTypeName} />
        )}
        {student.academicLeaveTypeName && (
          <ProfileField
            label="Академічна відпустка"
            value={student.academicLeaveTypeName}
          />
        )}
      </ProfileSection>

      {showSensitive &&
        (student.rnokpp ||
          student.studentTicketSeries ||
          student.passportDocumentSeries) && (
          <ProfileSection title="Документи" icon={FileText}>
            <ProfileField label="РНОКПП (ІПН)" value={student.rnokpp} />
            <ProfileField
              label="Студентський квиток"
              value={
                [student.studentTicketSeries, student.studentTicketNumbers]
                  .filter(Boolean)
                  .join("") || null
              }
            />
            <ProfileField
              label="Документ, що посвідчує особу"
              value={
                [
                  student.passportDocumentSeries,
                  student.passportDocumentNumbers,
                ]
                  .filter(Boolean)
                  .join(" ") || null
              }
            />
          </ProfileSection>
        )}
    </>
  )
}

function TeacherSections({ teacher }: { teacher: TeacherProfileDto }) {
  return (
    <>
      <ProfileSection title="Посада та підрозділ" icon={Briefcase}>
        <ProfileField
          label="Кафедра"
          value={
            teacher.universityFacultyChairFullName ??
            teacher.universityFacultyChairShortName
          }
        />
        <ProfileField
          label="Факультет / підрозділ"
          value={
            teacher.universityFacultyFullName ??
            teacher.universityFacultyShortName
          }
        />
        <ProfileField label="Посада" value={teacher.positionName} />
        <ProfileField label="Місце роботи" value={teacher.positionPlace} />
        {teacher.positionPluralityName &&
          teacher.positionPluralityName !== teacher.positionName && (
            <ProfileField
              label="Посада (сумісництво)"
              value={teacher.positionPluralityName}
            />
          )}
      </ProfileSection>

      <ProfileSection title="Кваліфікація" icon={Award}>
        <ProfileField label="Спеціальність" value={teacher.profession} />
        <ProfileField label="Вчене звання" value={teacher.rang} />
        <ProfileField label="Кваліфікаційна категорія" value={teacher.skillName} />
        {teacher.dignityNames && (
          <ProfileField label="Відзнаки / ступені" value={teacher.dignityNames} />
        )}
      </ProfileSection>

      <ProfileSection title="Стаж та зайнятість" icon={Clock}>
        <ProfileField label="Вид стажу" value={teacher.stageTypeName} />
        <ProfileField
          label="Загальний стаж"
          value={teacher.stage != null ? `${teacher.stage} р.` : null}
        />
        <ProfileField
          label="Дата прийому на роботу"
          value={formatDate(teacher.dateRecruit)}
        />
        {teacher.coursesInfo && (
          <ProfileField
            label="Підвищення кваліфікації"
            value={teacher.coursesInfo}
          />
        )}
      </ProfileSection>
    </>
  )
}

// ── Page ───────────────────────────────────────────────────────────

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === "string" ? params.id : null

  const currentUser = useAuthStore((s) => s.user)
  const isHydrated = useAuthStore((s) => s.isHydrated)

  const [state, setPageState] = useState<PageState>({ status: "loading" })
  const [retryKey, setRetry] = useState(0)

  // Визначаємо до fetch, щоб коректно вибрати endpoint
  const isOwnProfile = !!id && !!currentUser && id === currentUser.id

  useEffect(() => {
    // AuthGuard гарантує hydrated стан, але явна перевірка захищає від race condition
    if (!isHydrated) return
    if (!id) {
      setPageState({ status: "not_found" })
      return
    }

    let cancelled = false
    setPageState({ status: "loading" })

    ;(async () => {
      try {
        // Власний профіль — endpoint доступний для всіх авторизованих.
        // Чужий профіль — endpoint потребує ролі ADMINISTRATOR.
        const profile = isOwnProfile
          ? await userService.getProfile()
          : await userService.getById(id)

        if (!cancelled) setPageState({ status: "success", profile })
      } catch (err) {
        if (!cancelled) setPageState(classifyHttpError(err))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id, isOwnProfile, isHydrated, retryKey])

  // ── Loading ──────────────────────────────────────────────────────
  if (state.status === "loading") {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <ProfileSkeleton />
      </div>
    )
  }

  // ── Access errors ────────────────────────────────────────────────
  if (state.status === "forbidden") {
    return (
      <EmptyState
        icon={ShieldOff}
        title="Доступ заборонено"
        description="У вас немає прав для перегляду цього профілю."
        action={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            Назад
          </Button>
        }
      />
    )
  }

  if (state.status === "not_found") {
    return (
      <EmptyState
        icon={UserX}
        title="Профіль не знайдено"
        description="Користувача з таким ідентифікатором не існує або його було видалено."
        action={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            Назад
          </Button>
        }
      />
    )
  }

  if (state.status === "error") {
    return (
      <EmptyState
        icon={Info}
        title="Помилка завантаження"
        description={state.message}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRetry((k) => k + 1)}
          >
            Спробувати знову
          </Button>
        }
      />
    )
  }

  // ── Profile view ─────────────────────────────────────────────────
  const { profile } = state
  const displayName = getDisplayName(profile)
  // Чутливі поля (документи, 2FA) — тільки для власника профілю
  const showSensitive = isOwnProfile

  const personalBirthday =
    profile.student?.birthday ?? profile.teacher?.birthday
  const personalSex =
    profile.student?.personSexName ?? profile.teacher?.personSexName

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4">

      {/* ── Header card ─────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center shrink-0 select-none">
            {getInitials(displayName)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{displayName}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  USER_ROLE_COLORS[profile.role]
                )}
              >
                {USER_ROLE_LABELS[profile.role]}
              </span>
              {!profile.isActive && (
                <span className="inline-flex items-center rounded-full bg-destructive/10 text-destructive px-2.5 py-0.5 text-xs font-medium">
                  Неактивний
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1.5 truncate">
              {profile.email}
            </p>
          </div>

          {/* Owner-only action */}
          {isOwnProfile && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="shrink-0 self-start sm:self-auto"
            >
              <Link href="/settings">
                <Pencil size={13} />
                Редагувати профіль
              </Link>
            </Button>
          )}
        </div>
      </section>

      {/* ── Personal info (shared across all roles) ──────────────── */}
      <ProfileSection title="Особиста інформація" icon={User}>
        {personalBirthday && (
          <ProfileField
            label="Дата народження"
            value={formatDate(personalBirthday)}
          />
        )}
        {personalSex && <ProfileField label="Стать" value={personalSex} />}
        <ProfileField
          label="В системі з"
          value={formatDate(profile.createdAt)}
        />
        {showSensitive && (
          <ProfileField
            label="Двофакторна автентифікація"
            value={profile.isTwoFactorEnabled ? "Увімкнено" : "Вимкнено"}
          />
        )}
      </ProfileSection>

      {/* ── Role-specific sections ───────────────────────────────── */}
      {profile.role === "STUDENT" && profile.student && (
        <StudentSections
          student={profile.student}
          showSensitive={showSensitive}
        />
      )}

      {profile.role === "TEACHER" && profile.teacher && (
        <TeacherSections teacher={profile.teacher} />
      )}

      {profile.role !== "STUDENT" && profile.role !== "TEACHER" && (
        <ProfileSection title="Роль у системі" icon={Info}>
          <ProfileField
            label="Роль"
            value={USER_ROLE_LABELS[profile.role]}
          />
          <ProfileField
            label="Статус облікового запису"
            value={profile.isActive ? "Активний" : "Неактивний"}
          />
          <ProfileField
            label="В системі з"
            value={formatDate(profile.createdAt)}
          />
        </ProfileSection>
      )}

    </div>
  )
}
