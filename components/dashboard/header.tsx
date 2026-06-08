"use client"

import Link from "next/link"
import Image from "next/image"
import { Bell, LogOut, Menu, Moon, Settings, Sun, User } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLogout } from "@/features/auth/api"

interface HeaderProps {
  user: {
    name: string
    subtitle: string
  }
  onMenuClick: () => void
}

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(/[\s@]/) // розбиваємо і по пробілу і по @ (для email)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  return (
    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold shrink-0 select-none">
      {initials}
    </div>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-8 h-8" />

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Змінити тему"
    >
      {theme === "dark" ? (
        <Sun className="w-4.5 h-4.5" />
      ) : (
        <Moon className="w-4.5 h-4.5" />
      )}
    </Button>
  )
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const logout = useLogout()

  const handleLogout = () => {
    logout.mutate()
  }

  return (
    <header className="h-16 border-b border-border bg-card flex items-center px-4 gap-2 shrink-0">
      {/* Hamburger — desktop only */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        aria-label="Показати/приховати навігацію"
        className="hidden md:inline-flex"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Logo — mobile only */}
      <Link href="/dashboard" className="flex md:hidden items-center gap-2 mr-2">
        <Image
          src="/logo-dark.png"
          alt="MyKPEFK"
          width={28}
          height={28}
          className="block dark:hidden"
        />
        <Image
          src="/logo-light.png"
          alt="MyKPEFK"
          width={28}
          height={28}
          className="hidden dark:block"
        />
        <span className="font-semibold text-sm">MyKPEFK</span>
      </Link>

      <div className="flex-1" />

      <ThemeToggle />

      <Button variant="ghost" size="icon" aria-label="Сповіщення" className="relative">
        <Bell className="w-4.5 h-4.5" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
      </Button>

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
            aria-label="Меню користувача"
          >
            {/* User info — hidden on small mobile */}
            <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-border">
              <UserAvatar name={user.name} />
              <div className="hidden lg:block leading-tight">
                <p className="text-sm font-medium text-foreground truncate max-w-[180px]">
                  {user.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user.subtitle}
                </p>
              </div>
            </div>

            {/* Avatar only on very small screens */}
            <div className="flex sm:hidden">
              <UserAvatar name={user.name} />
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.subtitle}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Відкрити профіль
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile/settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Перейти до налаштувань
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        aria-label="Вийти"
        className="text-muted-foreground hover:text-destructive"
      >
        <LogOut className="w-4 h-4" />
      </Button>
    </header>
  )
}