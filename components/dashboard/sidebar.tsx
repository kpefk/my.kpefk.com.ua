"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calendar,
  ClipboardList,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Головна" },
  { href: "/dashboard/schedule", icon: Calendar, label: "Розклад" },
  { href: "/dashboard/grades", icon: BarChart3, label: "Оцінки" },
  { href: "/dashboard/assignments", icon: ClipboardList, label: "Завдання" },
];

const BOTTOM_ITEMS = [
  { href: "/dashboard/settings", icon: Settings, label: "Налаштування" },
];

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      initial={false}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="relative flex h-full flex-col border-r border-border bg-card overflow-hidden shrink-0"
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-4 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 w-8 h-8 flex items-center justify-center">
            <Image
              src="/logo-dark.png"
              alt="MyKPEFK"
              width={32}
              height={32}
              className="object-contain block dark:hidden"
            />
            <Image
              src="/logo-light.png"
              alt="MyKPEFK"
              width={32}
              height={32}
              className="object-contain hidden dark:block"
            />
          </div>
          <motion.span
            animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
            transition={{ duration: 0.18 }}
            className="font-semibold text-sm tracking-tight whitespace-nowrap overflow-hidden text-foreground"
          >
            MyKPEFK
          </motion.span>
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors relative",
                active
                  ? "bg-kpefk-light text-kpefk"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-kpefk"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <Icon
                className={cn(
                  "shrink-0 w-5 h-5 transition-colors",
                  active ? "text-kpefk" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <motion.span
                animate={{
                  opacity: collapsed ? 0 : 1,
                  width: collapsed ? 0 : "auto",
                }}
                transition={{ duration: 0.15 }}
                className="whitespace-nowrap overflow-hidden"
              >
                {label}
              </motion.span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="py-4 px-2 border-t border-border space-y-0.5">
        {BOTTOM_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-kpefk-light text-kpefk"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="shrink-0 w-5 h-5" />
              <motion.span
                animate={{
                  opacity: collapsed ? 0 : 1,
                  width: collapsed ? 0 : "auto",
                }}
                transition={{ duration: 0.15 }}
                className="whitespace-nowrap overflow-hidden"
              >
                {label}
              </motion.span>
            </Link>
          );
        })}
      </div>
    </motion.aside>
  );
}
