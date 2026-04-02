import axios from 'axios'

/**
 * Extracts the user-facing error message from an API call.
 * Uses the backend's `{ error: "..." }` field when available,
 * otherwise falls back to the provided fallback string.
 */
export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.error
    if (typeof msg === 'string' && msg.length > 0) return msg
  }
  return fallback
}
