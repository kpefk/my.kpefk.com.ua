import axios from 'axios'

import { getRecaptchaToken, isRecaptchaProtected } from '@/lib/recaptcha'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attaches a reCAPTCHA token to protected auth endpoints (password recovery).
api.interceptors.request.use(async (config) => {
  if (isRecaptchaProtected(config.url)) {
    const token = await getRecaptchaToken('auth')
    if (token) config.headers.set('recaptcha', token)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ??
      error.response?.data?.errorMessage ??
      'Сталася невідома помилка'

    return Promise.reject(new Error(message))
  },
)