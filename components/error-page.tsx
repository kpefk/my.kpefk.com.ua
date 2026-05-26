"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, RotateCcw } from "lucide-react"

const ERROR_META: Record<number, { title: string; description: string }> = {
  404: {
    title: "Сторінку не знайдено",
    description: "Сторінка, яку ви шукаєте, не існує або була переміщена.",
  },
  403: {
    title: "Доступ заборонено",
    description: "У вас немає прав для перегляду цієї сторінки.",
  },
  500: {
    title: "Помилка сервера",
    description: "Щось пішло не так на нашому боці. Ми вже працюємо над цим.",
  },
}

interface ErrorPageProps {
  error?: Error & { digest?: string }
  reset?: () => void
  code?: number
  message?: string
}

export default function ErrorPage({ reset, code = 500, message }: ErrorPageProps) {
  const info = ERROR_META[code] ?? ERROR_META[500]

  return (
    <div className="min-h-svh bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-6">

        <p className="text-[7rem] font-black leading-none tracking-tighter text-kpefk/15 select-none">
          {code}
        </p>

        <div className="space-y-1.5">
          <h1 className="text-xl font-bold">{info.title}</h1>
          <p className="text-sm text-muted-foreground text-balance">
            {message ?? info.description}
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          {reset && (
            <Button variant="outline" onClick={reset} className="gap-2">
              <RotateCcw size={14} />
              Повторити
            </Button>
          )}
          <Button asChild className="gap-2 bg-kpefk hover:bg-kpefk/90 text-kpefk-foreground">
            <Link href="/">
              <Home size={14} />
              На головну
            </Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Проблема не зникає?{" "}
          <a
            href="mailto:my@kpefk.com.ua"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            my@kpefk.com.ua
          </a>
        </p>

      </div>
    </div>
  )
}
