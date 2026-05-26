"use client";

import Image from "next/image";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Змінити тему"
    >
      {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
    </Button>
  );
}

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">

      {/* Left — form panel */}
      <div className="flex flex-col">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-dark.png"
              alt="MyKPEFK"
              width={36}
              height={36}
              className="block dark:hidden"
            />
            <Image
              src="/logo-light.png"
              alt="MyKPEFK"
              width={36}
              height={36}
              className="hidden dark:block"
            />
            <span className="font-semibold text-sm tracking-tight">MyKPEFK</span>
          </div>
          <ThemeToggle />
        </div>

        {/* Form area */}
        <div className="flex flex-1 items-center justify-center px-6 py-8">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </div>

        {/* Footer */}
        <p className="px-6 pb-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} ВСП КПЕФК ЛНТУ. Усі права захищено.
        </p>
      </div>

      {/* Right — college photo */}
      <div className="relative hidden lg:block overflow-hidden">
        <Image
          src="/college.png"
          alt="КПЕФК ЛНТУ"
          fill
          className="object-cover dark:brightness-[0.25] dark:grayscale"
          priority
        />
        {/* Teal gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.52_0.07_212/0.85)] via-[oklch(0.52_0.07_212/0.3)] to-transparent dark:from-background/90 dark:via-background/40" />
        {/* Branding text */}
        <div className="absolute bottom-10 left-10 right-10 text-white dark:text-foreground">
          <p className="text-xs font-medium uppercase tracking-widest opacity-80 mb-2">
            Ковельський промислово-економічний фаховий коледж ЛНТУ
          </p>
          <h2 className="text-3xl font-black leading-tight">
            Цифровий<br />кабінет студента
          </h2>
        </div>
      </div>

    </div>
  );
}
