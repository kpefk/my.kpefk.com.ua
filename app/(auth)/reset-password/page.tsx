import { ResetPasswordForm } from "@/components/reset_password-form"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Новий пароль",
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />
}