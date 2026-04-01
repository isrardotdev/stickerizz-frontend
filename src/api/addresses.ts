import { apiClient } from './client'

export type Address = {
  id: string
  userId: string
  isDefault: boolean
  fullName: string
  email: string
  phone: string
  line1: string
  line2?: string | null
  city: string
  state: string
  postalCode: string
  country: string
  createdAt: string
  updatedAt: string
}

export type AddressInput = {
  fullName: string
  email: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country?: string
  isDefault?: boolean
}

export const listAddresses = async () => {
  const response = await apiClient.get<Address[]>('/api/addresses')
  return response.data
}

export const createAddress = async (input: AddressInput) => {
  const response = await apiClient.post<Address>('/api/addresses', input)
  return response.data
}

export const updateAddress = async (addressId: string, input: AddressInput) => {
  const response = await apiClient.put<Address>(`/api/addresses/${addressId}`, input)
  return response.data
}

export const deleteAddress = async (addressId: string) => {
  await apiClient.delete(`/api/addresses/${addressId}`)
}

export const setDefaultAddress = async (addressId: string) => {
  const response = await apiClient.post<Address>(`/api/addresses/${addressId}/set-default`, undefined)
  return response.data
}
