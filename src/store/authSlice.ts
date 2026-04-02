import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as authApi from '../api/auth'
import { getApiErrorMessage } from '../api/errors'
import { posthog } from '../analytics/posthog'

type AuthState = {
  user: authApi.AuthUser | null
  status: 'idle' | 'loading' | 'authenticated' | 'error'
  error: string | null
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
}

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (input: { email: string; password: string }, { rejectWithValue }) => {
    try {
      return await authApi.login(input)
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Incorrect email or password. Please try again.'))
    }
  }
)

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (
    input: { email: string; password: string; name?: string },
    { rejectWithValue }
  ) => {
    try {
      return await authApi.register(input)
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Unable to create account. Please try again.'))
    }
  }
)

export const googleLoginThunk = createAsyncThunk(
  'auth/googleLogin',
  async (idToken: string, { rejectWithValue }) => {
    try {
      return await authApi.googleLogin(idToken)
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Google sign-in failed. Please try again.'))
    }
  }
)

export const verifyThunk = createAsyncThunk(
  'auth/verify',
  async (_: void, { rejectWithValue }) => {
    try {
      const user = await authApi.me()
      return { user }
    } catch {
      return rejectWithValue(null)
    }
  }
)

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  await authApi.logout()
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      state.status = 'idle'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.status = 'authenticated'
        state.error = null
        posthog.identify(action.payload.user.id, { email: action.payload.user.email })
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = 'error'
        state.error = String(action.payload ?? action.error.message ?? 'Login failed.')
      })
      .addCase(registerThunk.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.status = 'authenticated'
        state.error = null
        posthog.identify(action.payload.user.id, { email: action.payload.user.email })
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.status = 'error'
        state.error = String(action.payload ?? action.error.message ?? 'Registration failed.')
      })
      .addCase(googleLoginThunk.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(googleLoginThunk.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.status = 'authenticated'
        state.error = null
        posthog.identify(action.payload.user.id, { email: action.payload.user.email })
      })
      .addCase(googleLoginThunk.rejected, (state, action) => {
        state.status = 'error'
        state.error = String(action.payload ?? action.error.message ?? 'Google sign-in failed.')
      })
      .addCase(verifyThunk.pending, (state) => {
        if (state.status === 'idle') state.status = 'loading'
        state.error = null
      })
      .addCase(verifyThunk.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.status = 'authenticated'
        state.error = null
        posthog.identify(action.payload.user.id, { email: action.payload.user.email })
      })
      .addCase(verifyThunk.rejected, (state) => {
        state.status = 'idle'
        state.user = null
        state.error = null
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null
        state.status = 'idle'
        state.error = null
        posthog.reset()
      })
  },
})

export const { logout } = authSlice.actions
export default authSlice.reducer
