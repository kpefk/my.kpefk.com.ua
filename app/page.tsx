import { redirect } from "next/navigation";

// Root → dashboard. When auth is wired up, check the session here first:
// const session = await getSession()
// if (!session) redirect('/sign-in')

export default function RootPage() {
  redirect("/dashboard");
}
