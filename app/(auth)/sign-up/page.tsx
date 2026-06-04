import { SignUpForm } from "@/features/auth/components/sign-up-form"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Реєстрація",
  robots: { index: false },
};

export default function SignUpPage() {
  return <SignUpForm />
}
