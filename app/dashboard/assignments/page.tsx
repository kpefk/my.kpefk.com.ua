"use client";

import { useState } from "react";
import { CalendarClock, CheckCircle2, CircleDot, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockAssignments } from "@/lib/mock-data";
import type { AssignmentStatus } from "@/lib/types";

const STATUS_CONFIG: Record<AssignmentStatus, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}> = {
  pending: { label: "Активне", icon: CircleDot, color: "text-kpefk", bg: "bg-kpefk-light" },
  submitted: { label: "Здано", icon: CheckCircle2, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
  graded: { label: "Оцінено", icon: CheckCircle2, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20" },
  overdue: { label: "Прострочено", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
};

type Filter = "all" | AssignmentStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Всі" },
  { key: "pending", label: "Активні" },
  { key: "submitted", label: "Здано" },
  { key: "graded", label: "Оцінено" },
  { key: "overdue", label: "Прострочені" },
];

function deadlineText(deadline: Date, status: AssignmentStatus): { text: string; urgent: boolean } {
  if (status === "graded" || status === "submitted") {
    return {
      text: deadline.toLocaleDateString("uk-UA", { day: "numeric", month: "long" }),
      urgent: false,
    };
  }
  const now = new Date();
  const diff = Math.ceil((deadline.getTime() - now.getTime()) / 86_400_000);
  if (diff < 0) return { text: `Прострочено на ${Math.abs(diff)} дн.`, urgent: true };
  if (diff === 0) return { text: "Сьогодні!", urgent: true };
  if (diff === 1) return { text: "Завтра", urgent: true };
  if (diff <= 3) return { text: `Через ${diff} дні`, urgent: true };
  return {
    text: `${deadline.toLocaleDateString("uk-UA", { day: "numeric", month: "long" })} · ${diff} дн.`,
    urgent: false,
  };
}

export default function AssignmentsPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = mockAssignments
    .filter((a) => filter === "all" || a.status === filter)
    .sort((a, b) => {
      const order: AssignmentStatus[] = ["overdue", "pending", "submitted", "graded"];
      return order.indexOf(a.status) - order.indexOf(b.status) || a.deadline.getTime() - b.deadline.getTime();
    });

  const counts: Record<Filter, number> = {
    all: mockAssignments.length,
    pending: mockAssignments.filter((a) => a.status === "pending").length,
    submitted: mockAssignments.filter((a) => a.status === "submitted").length,
    graded: mockAssignments.filter((a) => a.status === "graded").length,
    overdue: mockAssignments.filter((a) => a.status === "overdue").length,
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Завдання</h1>
        <p className="text-sm text-muted-foreground mt-1">Поточні завдання та дедлайни</p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors",
              filter === key
                ? "bg-kpefk text-kpefk-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
            {counts[key] > 0 && (
              <span className={cn(
                "ml-1.5 text-xs",
                filter === key ? "opacity-75" : "opacity-60"
              )}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <p className="text-muted-foreground text-sm">Завдань немає</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((assignment) => {
            const cfg = STATUS_CONFIG[assignment.status];
            const Icon = cfg.icon;
            const dl = deadlineText(assignment.deadline, assignment.status);

            return (
              <div
                key={assignment.id}
                className="rounded-2xl border border-border bg-card p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">{assignment.subject}</p>
                    <p className="font-semibold text-sm leading-snug">{assignment.title}</p>
                  </div>
                  <div className={cn("shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full", cfg.bg, cfg.color)}>
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                    {assignment.grade !== undefined && (
                      <span className="ml-0.5 font-bold">{assignment.grade}</span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {assignment.description}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{assignment.teacherName}</span>
                  <div className={cn("flex items-center gap-1", dl.urgent && "text-destructive font-medium")}>
                    {dl.urgent ? (
                      <Clock className="w-3 h-3" />
                    ) : (
                      <CalendarClock className="w-3 h-3" />
                    )}
                    {dl.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
