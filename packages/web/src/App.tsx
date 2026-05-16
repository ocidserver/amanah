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
import ForgotPasswordPage from "./pages/ForgotPasswordPage"
import VerifyEmailPage from "./pages/VerifyEmailPage"
import ResetPasswordPage from "./pages/ResetPasswordPage"
import OnboardingPage from "./pages/OnboardingPage"
import BorrowerOnboardingPage from "./pages/BorrowerOnboardingPage"
import TrusteeOnboardingPage from "./pages/TrusteeOnboardingPage"
import BorrowerDashboard from "./pages/BorrowerDashboard"
import BorrowerLoanDetailPage from "./pages/BorrowerLoanDetailPage"
import BorrowerProfilPage from "./pages/BorrowerProfilPage"
import BorrowerPengaturanPage from "./pages/BorrowerPengaturanPage"
import BorrowerApplyPage from "./pages/BorrowerApplyPage"
import LenderApplicationsPage from "./pages/LenderApplicationsPage"
import ApplicationDetailPage from "./pages/ApplicationDetailPage"
import InvitationAcceptPage from "./pages/InvitationAcceptPage"
import TrusteeDashboard from "./pages/TrusteeDashboard"
import TrusteeLayout from "./components/TrusteeLayout"
import TrusteeProfilPage from "./pages/TrusteeProfilPage"
import TrusteePengaturanPage from "./pages/TrusteePengaturanPage"
import AdminDashboard from "./pages/AdminDashboard"
import AdminLayout from "./components/AdminLayout"
import AdminUsersPage from "./pages/AdminUsersPage"
import AdminLoansPage from "./pages/AdminLoansPage"
import AdminLoanDetailPage from "./pages/AdminLoanDetailPage"
import AdminTrusteePage from "./pages/AdminTrusteePage"
import AdminRoleChangesPage from "./pages/AdminRoleChangesPage"
import AdminUserDetailPage from "./pages/AdminUserDetailPage"
import AdminDocumentsPage from "./pages/AdminDocumentsPage"
import PaymentProofsPage from "./pages/PaymentProofsPage"
import AdminAuditLogsPage from "./pages/AdminAuditLogsPage"
import AdminTwoFactorSetupPage from "./pages/AdminTwoFactorSetupPage"
import NotFoundPage from "./pages/NotFoundPage"
import TrackPage from "./pages/TrackPage"
import TrackDetailPage from "./pages/TrackDetailPage"
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage"
import TermsPage from "./pages/TermsPage"
import AboutPage from "./pages/AboutPage"

function AuthOnlyRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { hasNoRole } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (hasNoRole) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasNoRole, isAdmin } = useAuth()
  if (isAuthenticated) {
    if (hasNoRole) return <Navigate to="/onboarding" replace />
    if (isAdmin) return <Navigate to="/admin" replace />
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

function RoleRedirect() {
  const { hasNoRole, isAdmin, isBorrower, isTrustee } = useAuth()
  if (hasNoRole) return <Navigate to="/onboarding" replace />
  if (isAdmin) return <Navigate to="/admin" replace />
  if (isBorrower) return <Navigate to="/borrower" replace />
  if (isTrustee) return <Navigate to="/trustee" replace />
  return <Navigate to="/dashboard" replace />
}

function CatchAllRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <RoleRedirect />
  return <NotFoundPage />
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
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
        <Route path="/verify-email" element={<PublicRoute><VerifyEmailPage /></PublicRoute>} />
        <Route path="/invite/:token" element={<InvitationAcceptPage />} />
        <Route path="/track" element={<TrackPage />} />
        <Route path="/track/:loanCode" element={<TrackDetailPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/onboarding" element={<AuthOnlyRoute><OnboardingPage /></AuthOnlyRoute>} />

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
          <Route path="/bukti-bayar" element={<PaymentProofsPage />} />
          <Route path="/pengajuan" element={<LenderApplicationsPage />} />
          <Route path="/pengajuan/:id" element={<ApplicationDetailPage />} />
          <Route path="/wali-amanah" element={<WaliAmanahPage />} />
          <Route path="/wali-amanah/undang" element={<UndangWaliPage />} />
          <Route path="/profil" element={<ProfilPage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <BorrowerLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/borrower/onboarding" element={<BorrowerOnboardingPage />} />
          <Route path="/borrower" element={<BorrowerDashboard />} />
          <Route path="/borrower/pinjaman/:id" element={<BorrowerLoanDetailPage />} />
          <Route path="/borrower/pengajuan" element={<BorrowerApplyPage />} />
          <Route path="/borrower/profil" element={<BorrowerProfilPage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <TrusteeLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/trustee/onboarding" element={<TrusteeOnboardingPage />} />
          <Route path="/trustee" element={<TrusteeDashboard />} />
          <Route path="/trustee/profil" element={<TrusteeProfilPage />} />
          <Route path="/trustee/pengaturan" element={<TrusteePengaturanPage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
          <Route path="/admin/documents" element={<AdminDocumentsPage />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
          <Route path="/admin/loans" element={<AdminLoansPage />} />
          <Route path="/admin/loans/:id" element={<AdminLoanDetailPage />} />
          <Route path="/admin/trustees" element={<AdminTrusteePage />} />
          <Route path="/admin/role-changes" element={<AdminRoleChangesPage />} />
          <Route path="/admin/2fa" element={<AdminTwoFactorSetupPage />} />
        </Route>

        <Route path="*" element={<CatchAllRoute />} />
      </Routes>
    </ErrorBoundary>
  )
}
