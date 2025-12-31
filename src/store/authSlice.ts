import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as authApi from '../api/auth'

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
      const message =
        error instanceof Error ? error.message : 'Unable to login.'
      return rejectWithValue(message)
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
      const message =
        error instanceof Error ? error.message : 'Unable to register.'
      return rejectWithValue(message)
    }
  }
)

export const verifyThunk = createAsyncThunk(
  'auth/verify',
  async (_: void, { rejectWithValue }) => {
    try {
      const user = await authApi.me()
      return { user }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to verify session.'
      return rejectWithValue(message)
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
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.status = 'error'
        state.error = String(action.payload ?? action.error.message ?? 'Registration failed.')
      })
      .addCase(verifyThunk.pending, (state) => {
        if (state.status === 'idle') state.status = 'loading'
        state.error = null
      })
      .addCase(verifyThunk.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.status = 'authenticated'
        state.error = null
      })
      .addCase(verifyThunk.rejected, (state, action) => {
        state.status = 'idle'
        state.user = null
        state.error = String(action.payload ?? action.error.message ?? 'Verify failed.')
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null
        state.status = 'idle'
        state.error = null
      })
  },
})

export const { logout } = authSlice.actions
export default authSlice.reducer
