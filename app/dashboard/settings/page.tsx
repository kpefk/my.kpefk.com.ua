"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth.store";

const THEMES = [
  { value: "light", label: "Світла", icon: Sun },
  { value: "dark", label: "Темна", icon: Moon },
  { value: "system", label: "Системна", icon: Monitor },
] as const;

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Налаштування</h1>
        <p className="text-muted-foreground mt-1 text-sm">Персоналізація кабінету</p>
      </div>

      {/* Profile */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Профіль
        </h2>
        {user ? (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-bold select-none shrink-0">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{user.email}</p>
              <p className="text-sm text-muted-foreground truncate">{user.role}</p>
            </div>
          </div>
        ) : (
          <div className="h-14 bg-muted rounded-xl animate-pulse" />
        )}
      </section>

      {/* Theme picker */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Тема оформлення
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                "flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border transition-all font-medium",
                mounted && theme === value
                  ? "border-primary bg-primary-light text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs sm:text-sm">{label}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
