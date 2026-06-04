import { ResetPasswordForm } from "@/features/auth/components/reset-password-form"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Новий пароль",
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />
}