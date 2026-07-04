import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    // Мінімальний CSP без script-src: Next.js вимагає inline-скриптів для гідратації,
    // тож обмежуємо лише вектори, які точно не використовуються (embedding, плагіни,
    // form-action на чужі домени). Повний script-src з nonce — окрема задача.
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
  },
]

const nextConfig: NextConfig = {
  allowedDevOrigins: ['172.16.95.106'],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig