"use client";

import { useUser } from "@/store/auth.store";

export default function AdminDashboardClient() {
    const user = useUser()

    if (!user || user.role !== "ADMINISTRATOR") return null;

    return (
        // Список користувачів
        // Кількість студентів
        // Кількість викладачів
        // Кількість груп
        <></>
    )
}