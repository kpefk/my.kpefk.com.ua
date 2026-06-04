export const APP_CONFIG = {
  name: 'MyKPEFK',
  url: 'https://my.kpefk.com.ua',
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
} as const
