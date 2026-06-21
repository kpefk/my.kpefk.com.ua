

import { AttendanceClient } from "@/components/attendance/AttendenceClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Відвідуваність',
}

export default function AttendancePage() {
    return <AttendanceClient />
}