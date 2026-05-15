import { create } from "zustand"
import { api, setTokens, clearTokens, getAccessToken } from "../lib/api"
import type { UserRole } from "@amanah/shared"

interface IUser {
  id: string
  email: string
  role: UserRole
  displayName: string | null
  borrowerTier: string | null
  lenderTier: string | null
  rating: string | null
}

interface IAuthState {
  accessToken: string | null
  user: IUser | null
  isLoading: boolean
  isAuthenticated: boolean
  register: (email: string, password: string, displayName?: string, role?: UserRole) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  restoreSession: () => Promise<void>
  fetchProfile: () => Promise<void>
}

export const useAuthStore = create<IAuthState>((set, get) => ({
  accessToken: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,

  register: async (email: string, password: string, displayName?: string, role?: UserRole) => {
    const data = await api.post<{
      accessToken: string
      refreshToken: string
      user: IUser
    }>("/auth/register", { email, password, displayName, role: role ?? "lender" })

    await setTokens(data.accessToken, data.refreshToken)
    set({
      accessToken: data.accessToken,
      user: data.user,
      isAuthenticated: true,
    })
  },

  login: async (email: string, password: string) => {
    const data = await api.post<{
      accessToken: string
      refreshToken: string
      user: IUser
    }>("/auth/login", { email, password })

    await setTokens(data.accessToken, data.refreshToken)
    set({
      accessToken: data.accessToken,
      user: data.user,
      isAuthenticated: true,
    })
  },

  signOut: async () => {
    const refreshToken = localStorage.getItem("auth_refresh_token")
    if (refreshToken) {
      try {
        await api.post("/auth/logout", { refreshToken })
      } catch {}
    }
    await clearTokens()
    set({ accessToken: null, user: null, isAuthenticated: false })
  },

  restoreSession: async () => {
    const token = await getAccessToken()
    if (token) {
      set({ accessToken: token, isAuthenticated: true, isLoading: false })
      get().fetchProfile()
    } else {
      const refreshToken = localStorage.getItem("auth_refresh_token")
      if (refreshToken) {
        try {
          const data = await api.post<{ accessToken: string; refreshToken: string }>("/auth/refresh", { refreshToken })
          await setTokens(data.accessToken, data.refreshToken)
          set({ accessToken: data.accessToken, isAuthenticated: true, isLoading: false })
          get().fetchProfile()
        } catch {
          await clearTokens()
          set({ accessToken: null, user: null, isAuthenticated: false, isLoading: false })
        }
      } else {
        set({ accessToken: null, user: null, isAuthenticated: false, isLoading: false })
      }
    }
  },

  fetchProfile: async () => {
    try {
      const profile = await api.get<IUser>("/auth/me")
      set({ user: profile })
    } catch {}
  },
}))