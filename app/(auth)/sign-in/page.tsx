import { SignInForm } from "@/components/sing_in-form"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Вхід",
  robots: { index: false },
};

export default function SignInPage() {
  return <SignInForm />
}