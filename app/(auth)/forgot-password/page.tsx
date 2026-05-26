import { ForgotPasswordForm } from "@/components/forgot_password-form"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Відновлення пароля",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}