"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Calendar, ClipboardList, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Головна" },
  { href: "/dashboard/schedule", icon: Calendar, label: "Розклад" },
  { href: "/dashboard/grades", icon: BarChart3, label: "Оцінки" },
  { href: "/dashboard/assignments", icon: ClipboardList, label: "Завдання" },
  { href: "/dashboard/settings", icon: Settings, label: "Профіль" },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex h-16 safe-bottom">
      {TABS.map(({ href, icon: Icon, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors",
              active ? "text-kpefk" : "text-muted-foreground"
            )}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
