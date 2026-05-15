import { useEffect } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { useAuthStore } from "./stores/auth-store"
import { useAuth } from "./hooks/use-auth"
import { ErrorBoundary } from "./components/ErrorBoundary"
import Layout from "./components/Layout"
import BorrowerLayout from "./components/BorrowerLayout"
import LandingPage from "./pages/LandingPage"
import BerandaPage from "./pages/BerandaPage"
import PinjamanPage from "./pages/PinjamanPage"
import PinjamanDetailPage from "./pages/PinjamanDetailPage"
import PinjamanBaruPage from "./pages/PinjamanBaruPage"
import PinjamanBaruSuccessPage from "./pages/PinjamanBaruSuccessPage"
import WaliAmanahPage from "./pages/WaliAmanahPage"
import UndangWaliPage from "./pages/UndangWaliPage"
import ProfilPage from "./pages/ProfilPage"
import PengaturanPage from "./pages/PengaturanPage"
import LoginPage from "./pages/LoginPage"
import SignUpPage from "./pages/SignUpPage"
import BorrowerDashboard from "./pages/BorrowerDashboard"
import BorrowerLoanDetailPage from "./pages/BorrowerLoanDetailPage"
import BorrowerProfilPage from "./pages/BorrowerProfilPage"
import BorrowerPengaturanPage from "./pages/BorrowerPengaturanPage"
import InvitationAcceptPage from "./pages/InvitationAcceptPage"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isBorrower } = useAuth()
  if (isAuthenticated) {
    return <Navigate to={isBorrower ? "/borrower" : "/dashboard"} replace />
  }
  return <>{children}</>
}

function RoleRedirect() {
  const { isBorrower } = useAuth()
  return <Navigate to={isBorrower ? "/borrower" : "/dashboard"} replace />
}

export default function App() {
  const restoreSession = useAuthStore((s) => s.restoreSession)
  const isLoading = useAuthStore((s) => s.isLoading)

  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-gray-400">
        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />
        <Route path="/invite/:token" element={<InvitationAcceptPage />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<BerandaPage />} />
          <Route path="/pinjaman" element={<PinjamanPage />} />
          <Route path="/pinjaman/baru" element={<PinjamanBaruPage />} />
          <Route path="/pinjaman/baru/success" element={<PinjamanBaruSuccessPage />} />
          <Route path="/pinjaman/:id" element={<PinjamanDetailPage />} />
          <Route path="/wali-amanah" element={<WaliAmanahPage />} />
          <Route path="/wali-amanah/undang" element={<UndangWaliPage />} />
          <Route path="/profil" element={<ProfilPage />} />
          <Route path="/pengaturan" element={<PengaturanPage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <BorrowerLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/borrower" element={<BorrowerDashboard />} />
          <Route path="/borrower/pinjaman/:id" element={<BorrowerLoanDetailPage />} />
          <Route path="/borrower/profil" element={<BorrowerProfilPage />} />
          <Route path="/borrower/pengaturan" element={<BorrowerPengaturanPage />} />
        </Route>

        <Route path="*" element={<RoleRedirect />} />
      </Routes>
    </ErrorBoundary>
  )
}