import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Сторінка не знайдена",
  description: "На жаль, сторінку, яку ви шукаєте, не знайдено.",
}

import ErrorPage from "@/components/error-page"


export default function NotFound() {
  return <ErrorPage code={404} />
}