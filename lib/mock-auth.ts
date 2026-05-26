import type { User } from "@/lib/types";

const SESSION_KEY = "kpefk_session";

// TODO: replace with real API — POST /api/auth/sign-in
export const MOCK_USERS: (User & { password: string })[] = [
  {
    id: "u-001",
    name: "Олексій Шевченко",
    email: "student@kpefk.com.ua",
    password: "demo",
    role: "student",
    group: "КН-31",
    avatarUrl: null,
  },
  {
    id: "u-002",
    name: "Марина Ковальчук",
    email: "test@kpefk.com.ua",
    password: "demo",
    role: "student",
    group: "ЕК-21",
    avatarUrl: null,
  },
];

export function login(email: string, password: string): User | null {
  const found = MOCK_USERS.find(
    (u) => u.email === email && u.password === password
  );
  if (!found) return null;
  const { password: _pw, ...user } = found;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export function registerMock(email: string): User {
  const user: User = {
    id: `u-${Date.now()}`,
    name: email.split("@")[0],
    email,
    role: "student",
    avatarUrl: null,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}
