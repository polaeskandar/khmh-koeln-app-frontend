const DEVELOPMENT_API = "http://localhost:8000/api"

export function parseApiBaseUrl(
  value: string | undefined,
  { production }: { production: boolean }
) {
  if (!value) {
    if (production) {
      throw new Error(
        "NEXT_PUBLIC_API_BASE_URL is required in production builds: /api, or the API's absolute URL (see .env.example)."
      )
    }

    return DEVELOPMENT_API
  }

  if (value === "/api" || (/^https?:\/\/[^/\s]+(\/\S*)?$/.test(value) && !value.endsWith("/"))) {
    return value
  }

  throw new Error(
    `NEXT_PUBLIC_API_BASE_URL must be /api or an absolute http(s) URL without a trailing slash, not "${value}".`
  )
}

export const apiBaseUrl = () =>
  parseApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL, {
    production: process.env.NODE_ENV === "production",
  })

export const registrationEnabled = () => process.env.NEXT_PUBLIC_REGISTRATION_ENABLED === "true"
