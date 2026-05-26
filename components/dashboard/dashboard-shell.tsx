"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/mock-auth";
import type { User } from "@/lib/types";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { BottomTabBar } from "@/components/dashboard/bottom-tab-bar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/sign-in");
    } else {
      setUser(session);
    }
  }, [router]);

  if (!user) return null;

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      {/* Sidebar — desktop only */}
      <div className="hidden md:block h-full shrink-0">
        <Sidebar collapsed={collapsed} />
      </div>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          user={user}
          onMenuClick={() => setCollapsed((c) => !c)}
        />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Bottom tab bar — mobile only */}
      <BottomTabBar />
    </div>
  );
}
