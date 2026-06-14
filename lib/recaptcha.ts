// reCAPTCHA v3 (invisible, score-based) helper.
//
// The backend (@nestlab/google-recaptcha) reads the token from the `recaptcha`
// request header. This module lazily loads the Google script once and exposes
// `getRecaptchaToken(action)` which the axios interceptors call before sending
// protected auth requests (login / register / password-recovery).
//
// If NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set (e.g. local dev), this is a no-op
// and returns an empty string — the backend skips verification in dev anyway.

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void
      execute: (siteKey: string, opts: { action: string }) => Promise<string>
    }
  }
}

let scriptPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (typeof window === 'undefined' || !SITE_KEY) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    if (window.grecaptcha) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`
    script.async = true
    script.defer = true
    script.dataset.recaptcha = 'true'
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Не вдалося завантажити reCAPTCHA'))
    }
    document.head.appendChild(script)
  })

  return scriptPromise
}

/**
 * Returns a fresh reCAPTCHA v3 token for the given action, or '' if reCAPTCHA
 * is not configured (the backend skips verification in that case).
 */
export async function getRecaptchaToken(action: string): Promise<string> {
  if (typeof window === 'undefined' || !SITE_KEY) return ''

  try {
    await loadScript()
    const grecaptcha = window.grecaptcha
    if (!grecaptcha) return ''

    await new Promise<void>((resolve) => grecaptcha.ready(() => resolve()))
    return await grecaptcha.execute(SITE_KEY, { action })
  } catch {
    // Fail open on the client: let the request proceed; the backend remains the
    // authoritative gate and will reject if a token is required but missing.
    return ''
  }
}

/**
 * URL path prefixes that require a reCAPTCHA token. Kept in sync with the
 * backend `@Recaptcha()`-decorated endpoints.
 */
export const RECAPTCHA_PROTECTED_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/password-recovery/reset',
  '/auth/password-recovery/new',
] as const

/** True when the given request URL targets a reCAPTCHA-protected endpoint. */
export function isRecaptchaProtected(url: string | undefined): boolean {
  if (!url) return false
  return RECAPTCHA_PROTECTED_PATHS.some((path) => url.includes(path))
}
