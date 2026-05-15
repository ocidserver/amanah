import { useAuthStore } from "../stores/auth-store"
import type { UserRole } from "@amanah/shared"

export function useAuth() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const register = useAuthStore((s) => s.register)
  const login = useAuthStore((s) => s.login)
  const signOut = useAuthStore((s) => s.signOut)
  const restoreSession = useAuthStore((s) => s.restoreSession)
  const updateProfile = useAuthStore((s) => s.updateProfile)

  const isLender = user?.role === "lender"
  const isBorrower = user?.role === "borrower"

  return { accessToken, user, isLoading, isAuthenticated, register, login, signOut, restoreSession, updateProfile, isLender, isBorrower }
}