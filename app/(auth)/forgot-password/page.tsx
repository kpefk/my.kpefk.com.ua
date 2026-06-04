import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Відновлення пароля",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}