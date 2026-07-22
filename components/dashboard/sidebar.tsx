"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Award,            // Атестація викладачів
  BarChart3,
  BookMarked,
  BookOpenCheck,
  Building2,
  Calendar,
  CalendarRange,
  ChevronDown,      // для стрілки subItems
  ClipboardList,
  ClipboardPen,
  DoorOpen,
  FileCheck2,       // Перезарахування кредитів
  FileStack,        // Зведені відомості
  FileText,         // Шаблони дипломів
  GraduationCap,
  LayoutDashboard,
  Library,
  ListChecks,       // Список заяв (вступ)
  MessageSquareText,
  Plane,            // Академічна мобільність
  School,
  ScrollText,
  SlidersHorizontal, // Налаштування вступу
  Stamp,            // Генерація дипломів (основна)
  Trophy,           // Рейтинг успішності
  UserCheck,
  UserCog,
  UserPlus,         // Вступна кампанія
  Users,
  UserSearch,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SubItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  subItems?: SubItem[];
}

const NAV_ITEMS: NavItem[] = [
  // Загальне
  { href: "/dashboard", icon: LayoutDashboard, label: "Головна" },

  // Для студентів
  { href: "/electives",    icon: BookMarked,    label: "Вибіркові дисципліни" },
  { href: "/schedule",     icon: Calendar,      label: "Розклад занять" },
  { href: "/grades",       icon: BarChart3,     label: "Успішність" },
  { href: "/assignments",  icon: ClipboardList, label: "Завдання" },
  { href: "/surveys",      icon: MessageSquareText, label: "Опитування" },

  // Для викладачів
  { href: "/attendance",   icon: UserCheck,     label: "Відвідуваність" },
  { href: "/my-group",     icon: Users,         label: "Моя група" },
  { href: "/my-classroom", icon: DoorOpen,      label: "Мій кабінет" },

  // Для заступника директора
  { href: "/academic-plans",   icon: Library,       label: "Навчальні плани" },
  { href: "/teacher-load",     icon: BookOpenCheck, label: "Педагогічне навантаження" },
  { href: "/schedule/builder", icon: CalendarRange, label: "Конструктор розкладу" },
  {
    href: "#",
    icon: Stamp,
    label: "Генерація дипломів",
    subItems: [
      { href: "/diplomas/generate", icon: Stamp,      label: "Генерація дипломів" },
      { href: "/diplomas/templates", icon: FileText,   label: "Шаблони дипломів" },
      { href: "/diplomas/reports",   icon: FileStack,  label: "Зведені відомості" },
    ],
  },
  { href: "/academic-groups", icon: Users, label: "Навчальні групи" },
  { href: "/rating",          icon: Trophy, label: "Рейтинг успішності" },
  { href: "/credit-recognition", icon: FileCheck2, label: "Перезарахування кредитів" },
  { href: "/academic-mobility",  icon: Plane,      label: "Академічна мобільність" },
  {
    href: "#admissions",
    icon: UserPlus,
    label: "Вступна кампанія",
    subItems: [
      { href: "/admissions",              icon: BarChart3,         label: "Огляд" },
      { href: "/admissions/applications", icon: ListChecks,        label: "Список заяв" },
      { href: "/admissions/settings",     icon: SlidersHorizontal, label: "Налаштування" },
    ],
  },

  // Для адміністраторів
  { href: "/individual-plans",      icon: ClipboardPen,  label: "Індивідуальні плани" },
  { href: "/electives/admin",       icon: BookMarked,    label: "ВК — адміністрування" },
  { href: "/classrooms",            icon: School,        label: "Навчальні кабінети" },
  { href: "/educational-programs",  icon: BookMarked,    label: "Список ОПП" },
  { href: "/users",                 icon: UserSearch,    label: "Список користувачів" },
  { href: "/students",              icon: GraduationCap, label: "Список студентів" },
  { href: "/teachers",              icon: UserCog,       label: "Список викладачів" },
  { href: "/attestation",           icon: Award,         label: "Атестація викладачів" },
  { href: "/institution",           icon: Building2,     label: "Про заклад" },
];

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (href: string) => {
    setOpenGroups((prev) => ({ ...prev, [href]: !prev[href] }));
  };

  const isGroupActive = (item: NavItem) =>
    item.subItems?.some((sub) => pathname === sub.href) ?? false;

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
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5 scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const { href, icon: Icon, label, subItems } = item;
          const hasSubItems = !!subItems?.length;
          const groupActive = isGroupActive(item);
          const isOpen = openGroups[href] ?? groupActive;

          // --- Елемент з підпунктами ---
          if (hasSubItems) {
            return (
              <div key={href}>
                <button
                  onClick={() => !collapsed && toggleGroup(href)}
                  className={cn(
                    "group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors relative",
                    groupActive
                      ? "bg-primary-light dark:text-white"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {groupActive && (
                    <motion.span
                      layoutId="sidebar-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                  <Icon
                    className={cn(
                      "shrink-0 w-5 h-5 transition-colors",
                      groupActive
                        ? "dark:text-primary text-dark"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <motion.span
                    animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 text-left whitespace-nowrap overflow-hidden"
                  >
                    {label}
                  </motion.span>
                  {/* Стрілка — прихована коли collapsed */}
                  <motion.span
                    animate={{
                      opacity: collapsed ? 0 : 1,
                      rotate: isOpen ? 180 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                  >
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </motion.span>
                </button>

                {/* SubItems список */}
                <AnimatePresence initial={false}>
                  {isOpen && !collapsed && (
                    <motion.div
                      key="sub"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="mt-0.5 ml-4 pl-3 border-l border-border space-y-0.5 pb-1">
                        {subItems.map((sub) => {
                          const subActive = pathname === sub.href;
                          const SubIcon = sub.icon;
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className={cn(
                                "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors relative",
                                subActive
                                  ? "bg-primary-light text-foreground dark:text-white"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              )}
                            >
                              <SubIcon
                                className={cn(
                                  "shrink-0 w-4 h-4",
                                  subActive
                                    ? "dark:text-primary text-dark"
                                    : "text-muted-foreground group-hover:text-foreground"
                                )}
                              />
                              <span className="whitespace-nowrap overflow-hidden">
                                {sub.label}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          // --- Звичайний елемент ---
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors relative",
                active
                  ? "bg-primary-light dark:text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <Icon
                className={cn(
                  "shrink-0 w-5 h-5 transition-colors",
                  active
                    ? "dark:text-primary text-dark"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <motion.span
                animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
                transition={{ duration: 0.15 }}
                className="whitespace-nowrap overflow-hidden"
              >
                {label}
              </motion.span>
            </Link>
          );
        })}
      </nav>
    </motion.aside>
  );
}