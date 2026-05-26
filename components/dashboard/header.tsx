"use client";

import Link from "next/link";
import Image from "next/image";
import { Bell, LogOut, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/mock-auth";
import type { User } from "@/lib/types";

interface HeaderProps {
  user: User;
  onMenuClick: () => void;
}

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="w-8 h-8 rounded-full bg-kpefk flex items-center justify-center text-kpefk-foreground text-xs font-semibold shrink-0 select-none">
      {initials}
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />;

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
  );
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/sign-in");
  };

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

      {/* Logo — mobile only (sidebar hidden) */}
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
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-kpefk" />
      </Button>

      {/* User info — hidden on small mobile */}
      <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-border">
        <UserAvatar name={user.name} />
        <div className="hidden lg:block leading-tight">
          <p className="text-sm font-medium text-foreground">{user.name}</p>
          <p className="text-xs text-muted-foreground">
            {user.group ?? user.department ?? user.email}
          </p>
        </div>
      </div>

      {/* Avatar only on very small screens */}
      <div className="flex sm:hidden">
        <UserAvatar name={user.name} />
      </div>

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
  );
}
