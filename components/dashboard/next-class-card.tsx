"use client";

import { Clock, DoorOpen, User } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ScheduleEvent } from "@/lib/types";

const TYPE_LABELS: Record<ScheduleEvent["type"], string> = {
  lecture: "Лекція",
  practice: "Практика",
  lab: "Лабораторна",
  seminar: "Семінар",
};

const TYPE_COLORS: Record<ScheduleEvent["type"], string> = {
  lecture: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  practice: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  lab: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  seminar: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

interface NextClassCardProps {
  event: ScheduleEvent | undefined;
  delay?: number;
}

export function NextClassCard({ event, delay = 0 }: NextClassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Наступна пара
        </h2>
        {event && (
          <span
            className={cn(
              "text-xs font-medium px-2.5 py-1 rounded-full",
              TYPE_COLORS[event.type]
            )}
          >
            {TYPE_LABELS[event.type]}
          </span>
        )}
      </div>

      {event ? (
        <>
          <p className="text-xl font-bold text-foreground leading-tight">
            {event.subject}
          </p>
          <div className="grid grid-cols-1 gap-2">
            <InfoRow icon={Clock} text={`${event.startTime} – ${event.endTime}`} />
            <InfoRow icon={DoorOpen} text={`Аудиторія ${event.room}`} />
            <InfoRow icon={User} text={event.teacher} />
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center py-6">
          <p className="text-muted-foreground text-sm text-center">
            Сьогодні більше занять немає.
            <br />
            Гарного відпочинку!
          </p>
        </div>
      )}
    </motion.div>
  );
}

function InfoRow({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
      <Icon className="w-4 h-4 text-kpefk shrink-0" />
      <span>{text}</span>
    </div>
  );
}
