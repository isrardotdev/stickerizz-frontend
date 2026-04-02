import { apiClient } from './client'

export type AuthUser = {
  id: string
  email: string
  name: string | null
  role: string
  avatarUrl: string | null
  hasPassword: boolean
}

export type AuthResponse = { user: AuthUser }

export const login = async (input: { email: string; password: string }) => {
  const response = await apiClient.post<AuthResponse>('/auth/login', input)
  return response.data
}

export const register = async (input: { email: string; password: string; name?: string }) => {
  const response = await apiClient.post<AuthResponse>('/auth/register', input)
  return response.data
}

export const me = async () => {
  const response = await apiClient.get<{ user: AuthUser }>('/auth/me')
  return response.data.user
}

export const changePassword = async (input: { oldPassword: string; newPassword: string }) => {
  await apiClient.post('/auth/change-password', input)
}

export const googleLogin = async (idToken: string) => {
  const response = await apiClient.post<AuthResponse>('/auth/google', { idToken })
  return response.data
}

export const logout = async () => {
  await apiClient.post('/auth/logout')
}
