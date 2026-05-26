"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { GradesSummary } from "@/lib/types";

interface GradesCardProps {
  summary: GradesSummary;
  delay?: number;
}

function GradeBar({ name, average }: { name: string; average: number }) {
  const pct = (average / 5) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground truncate max-w-[70%]">{name}</span>
        <span
          className={cn(
            "font-semibold",
            average >= 4.5
              ? "text-green-600 dark:text-green-400"
              : average >= 3.5
              ? "text-kpefk"
              : "text-orange-500"
          )}
        >
          {average.toFixed(1)}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-kpefk"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

export function GradesCard({ summary, delay = 0 }: GradesCardProps) {
  const avg = summary.average;
  const color =
    avg >= 4.5
      ? "text-green-600 dark:text-green-400"
      : avg >= 3.5
      ? "text-kpefk"
      : "text-orange-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col gap-5"
    >
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Успішність
      </h2>

      {/* Average score */}
      <div className="flex items-end gap-3">
        <span className={cn("text-5xl font-bold leading-none", color)}>
          {avg.toFixed(1)}
        </span>
        <div className="pb-1 text-muted-foreground text-sm leading-tight">
          <p>середній бал</p>
          <p>{summary.totalSubjects} предметів</p>
        </div>
      </div>

      {/* Subject bars */}
      <div className="space-y-3">
        {summary.subjects.slice(0, 5).map((s) => (
          <GradeBar key={s.name} name={s.name} average={s.average} />
        ))}
      </div>
    </motion.div>
  );
}
