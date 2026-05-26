"use client";

import { motion } from "framer-motion";
import { AlertCircle, CalendarClock, Info, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Announcement, AnnouncementCategory } from "@/lib/types";

const CATEGORY_CONFIG: Record<
  AnnouncementCategory,
  { icon: React.ElementType; label: string; color: string }
> = {
  schedule: {
    icon: CalendarClock,
    label: "Розклад",
    color:
      "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  },
  important: {
    icon: AlertCircle,
    label: "Важливо",
    color:
      "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
  },
  event: {
    icon: PartyPopper,
    label: "Захід",
    color:
      "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  },
  general: {
    icon: Info,
    label: "Загальне",
    color:
      "bg-muted text-muted-foreground",
  },
};

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Сьогодні";
  if (days === 1) return "Вчора";
  if (days < 7) return `${days} дн. тому`;
  return date.toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
}

function AnnouncementItem({
  item,
  index,
}: {
  item: Announcement;
  index: number;
}) {
  const cfg = CATEGORY_CONFIG[item.category];
  const Icon = cfg.icon;

  return (
    <motion.li
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.4,
        delay: 0.1 + index * 0.07,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="flex gap-3 py-4 border-b border-border last:border-0"
    >
      {/* Category icon */}
      <div
        className={cn(
          "mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
          cfg.color
        )}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm font-semibold leading-snug",
              item.isNew ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {item.title}
            {item.isNew && (
              <span className="ml-2 inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-kpefk-foreground bg-kpefk rounded-full px-1.5 py-0.5 align-middle">
                Нове
              </span>
            )}
          </p>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {timeAgo(item.date)}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
          {item.content}
        </p>
        {item.author && (
          <p className="mt-1 text-[11px] text-muted-foreground/70">
            {item.author}
          </p>
        )}
      </div>
    </motion.li>
  );
}

interface AnnouncementsFeedProps {
  items: Announcement[];
  delay?: number;
}

export function AnnouncementsFeed({ items, delay = 0 }: AnnouncementsFeedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Оголошення
      </h2>
      <ul>
        {items.map((item, i) => (
          <AnnouncementItem key={item.id} item={item} index={i} />
        ))}
      </ul>
    </motion.div>
  );
}
