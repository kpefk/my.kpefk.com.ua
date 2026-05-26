"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getSession } from "@/lib/mock-auth";
import type { User } from "@/lib/types";

const UK_MONTHS = [
  "січня", "лютого", "березня", "квітня", "травня", "червня",
  "липня", "серпня", "вересня", "жовтня", "листопада", "грудня",
];
const UK_WEEKDAYS = [
  "Неділя", "Понеділок", "Вівторок", "Середа",
  "Четвер", "П'ятниця", "Субота",
];

function formatDate(d: Date) {
  const day = d.getDate();
  const month = UK_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  const weekday = UK_WEEKDAYS[d.getDay()];
  return { day, month, year, weekday };
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Доброї ночі";
  if (h < 12) return "Доброго ранку";
  if (h < 17) return "Доброго дня";
  return "Доброго вечора";
}

export function WelcomeBanner() {
  const [user, setUser] = useState<User | null>(null);
  const { day, month, year, weekday } = formatDate(new Date());

  useEffect(() => {
    setUser(getSession());
  }, []);

  const firstName = user
    ? (user.name.split(" ")[1] ?? user.name.split(" ")[0])
    : "…";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl bg-kpefk p-5 sm:p-8 text-kpefk-foreground"
    >
      <p className="text-xs sm:text-sm font-medium opacity-80 mb-1">
        {weekday}, {day} {month} {year}
      </p>
      <h1 className="text-xl sm:text-3xl font-bold tracking-tight">
        {getGreeting()}, {firstName}!
      </h1>
      {user?.group && (
        <p className="mt-1.5 text-xs sm:text-sm opacity-75">
          Група {user.group} · {year - 2023}-й рік навчання
        </p>
      )}
    </motion.div>
  );
}
