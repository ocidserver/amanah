import { create } from "zustand"
import { api, setTokens, clearTokens, getAccessToken } from "../lib/api"
import type { UserRole } from "@amanah/shared"

interface IUser {
  id: string
  email: string
  role: UserRole | null
  displayName: string | null
  phone: string | null
  idNumber: string | null
  address: string | null
  occupation: string | null
  ktpDocumentUrl: string | null
  profileCompleted: boolean
  isVerified: boolean
  borrowerTier: string | null
  lenderTier: string | null
  rating: string | null
  ratingCount: number
  onTimePercentage: string | null
  completedLoans: number
}

interface IAuthState {
  accessToken: string | null
  user: IUser | null
  isLoading: boolean
  isAuthenticated: boolean
  register: (email: string, password: string, displayName?: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  setRole: (role: UserRole) => Promise<void>
  signOut: () => Promise<void>
  restoreSession: () => Promise<void>
  fetchProfile: () => Promise<void>
  updateProfile: (displayName: string) => Promise<void>
  uploadKtp: (file: File) => Promise<string>
}

export const useAuthStore = create<IAuthState>((set, get) => ({
  accessToken: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,

  register: async (email: string, password: string, displayName?: string) => {
    const data = await api.post<{
      accessToken: string
      refreshToken: string
      user: IUser
    }>("/auth/register", { email, password, displayName })

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

  setRole: async (role: UserRole) => {
    const data = await api.post<{
      user: IUser
      accessToken: string
      refreshToken: string
    }>("/auth/set-role", { role })

    await setTokens(data.accessToken, data.refreshToken)
    set({
      user: data.user,
      accessToken: data.accessToken,
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
      set({ accessToken: token, isAuthenticated: true })
      await get().fetchProfile()
      set({ isLoading: false })
    } else {
      const refreshToken = localStorage.getItem("auth_refresh_token")
      if (refreshToken) {
        try {
          const data = await api.post<{ accessToken: string; refreshToken: string }>("/auth/refresh", { refreshToken })
          await setTokens(data.accessToken, data.refreshToken)
          set({ accessToken: data.accessToken, isAuthenticated: true })
          await get().fetchProfile()
          set({ isLoading: false })
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
    } catch (err) {
      console.error("Failed to fetch profile:", err)
      await clearTokens()
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  updateProfile: async (displayName: string) => {
    const updated = await api.patch<IUser>("/auth/me", { displayName })
    set({ user: updated })
  },

  uploadKtp: async (file: File) => {
    const formData = new FormData()
    formData.append("image", file)
    const token = getAccessToken()
    const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/upload-ktp`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Gagal upload KTP")
    }
    const data = await res.json()
    await get().fetchProfile()
    return data.ktpDocumentUrl as string
  },
}))
