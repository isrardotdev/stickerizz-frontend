import posthog from 'posthog-js'
import { env } from '../config/env'

export function initPostHog() {
  if (!env.POSTHOG_PROJECT_TOKEN) return

  posthog.init(env.POSTHOG_PROJECT_TOKEN, {
    api_host: env.POSTHOG_HOST,
    person_profiles: 'identified_only',
  })
}

export { posthog }
