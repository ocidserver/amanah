import { useAuthStore } from "../stores/auth-store"
import type { UserRole } from "@amanah/shared"

export function useAuth() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const register = useAuthStore((s) => s.register)
  const login = useAuthStore((s) => s.login)
  const setRole = useAuthStore((s) => s.setRole)
  const signOut = useAuthStore((s) => s.signOut)
  const restoreSession = useAuthStore((s) => s.restoreSession)
  const fetchProfile = useAuthStore((s) => s.fetchProfile)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const uploadKtp = useAuthStore((s) => s.uploadKtp)

  const isLender = user?.role === "lender"
  const isBorrower = user?.role === "borrower"
  const isTrustee = user?.role === "trustee"
  const hasNoRole = !user?.role

  return { accessToken, user, isLoading, isAuthenticated, register, login, setRole, signOut, restoreSession, fetchProfile, updateProfile, uploadKtp, isLender, isBorrower, isTrustee, hasNoRole }
}
