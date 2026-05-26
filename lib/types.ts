export type UserRole = "student" | "teacher" | "admin";

export type ClassType = "lecture" | "practice" | "lab" | "seminar";

export type AnnouncementCategory =
  | "schedule"
  | "general"
  | "event"
  | "important";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  group?: string;
  department?: string;
  avatarUrl: string | null;
}

export interface ScheduleEvent {
  id: string;
  subject: string;
  teacher: string;
  room: string;
  startTime: string;
  endTime: string;
  type: ClassType;
  date: Date;
  lessonNumber: number;
}

export interface Grade {
  id: string;
  subject: string;
  value: number;
  maxValue: number;
  date: Date;
  type: "exam" | "credit" | "test" | "coursework";
  teacherName: string;
}

export interface GradesSummary {
  average: number;
  totalSubjects: number;
  subjects: Array<{
    name: string;
    average: number;
    grades: Grade[];
  }>;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: Date;
  category: AnnouncementCategory;
  isNew: boolean;
  author?: string;
}

export type AssignmentStatus = "pending" | "submitted" | "overdue" | "graded";

export interface Assignment {
  id: string;
  subject: string;
  title: string;
  description: string;
  deadline: Date;
  status: AssignmentStatus;
  grade?: number;
  teacherName: string;
}
