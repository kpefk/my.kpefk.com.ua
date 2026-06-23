import type { Metadata } from "next";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { NextClassCard } from "@/components/dashboard/next-class-card";
import { GradesCard } from "@/components/dashboard/grades-card";
import { AnnouncementsFeed } from "@/components/dashboard/announcements-feed";
import { MyTeacherLoadCard } from "@/features/teacher-load/components/my-teacher-load-card";
import {
  mockTodaySchedule,
  mockGradesSummary,
  mockAnnouncements,
  getNextClass,
} from "@/lib/mock-data";
import AdminDashboardClient from "@/components/dashboard/AdminDashboardClient";

export const metadata: Metadata = {
  title: "Головна",

};

export default function DashboardPage() {
  // When you connect the real API, replace these with server-side fetch calls:
  // const user = await api.auth.me()
  // const schedule = await api.schedule.today(user.id)
  // const grades = await api.grades.summary(user.id)
  // const announcements = await api.announcements.latest(5)

  const nextClass = getNextClass(mockTodaySchedule);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Welcome banner — reads session user client-side */}
      {/* <WelcomeBanner /> */}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          <NextClassCard event={nextClass} delay={0.1} />
          <AnnouncementsFeed items={mockAnnouncements} delay={0.2} />
        </div>


        {/* Right column */}
        <div className="lg:col-span-1 space-y-5">
          {/* Викладачам — їхнє педагогічне навантаження (для інших ролей рендериться null) */}
          <AdminDashboardClient />
          <MyTeacherLoadCard />
          <GradesCard summary={mockGradesSummary} delay={0.15} />
        </div>
      </div>
    </div>
  );
}
