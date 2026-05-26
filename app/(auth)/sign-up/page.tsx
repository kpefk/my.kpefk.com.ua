import { SignUpForm } from "@/components/sing_up-form"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Реєстрація",
  robots: { index: false },
};

export default function SignUpPage() {
  return <SignUpForm />
}
