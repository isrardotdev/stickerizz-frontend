export const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
  POSTHOG_PROJECT_TOKEN: import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN as string,
  POSTHOG_HOST: import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string,
} as const
