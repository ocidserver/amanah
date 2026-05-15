import { useAuth } from "../hooks/use-auth"
import { useNavigate } from "react-router-dom"
import { IconMail, IconShield, IconLogOut } from "../components/Icons"
import { useState } from "react"
import { api } from "../lib/api"

function SettingItem({ icon, label, subtitle, onClick, danger }: {
  icon: React.ReactNode
  label: string
  subtitle?: string
  onClick?: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50 transition-colors ${
        danger ? "text-red-600" : "text-gray-900"
      }`}
    >
      <span className={danger ? "text-red-500" : "text-gray-400"}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[15px]">{label}</p>
        {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
      </div>
    </button>
  )
}

function ChangePasswordForm({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (newPassword !== confirmPassword) { setError("Password baru tidak cocok"); return }
    if (newPassword.length < 6) { setError("Password minimal 6 karakter"); return }
    setLoading(true)
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword })
      setSuccess(true)
      setTimeout(() => onClose(), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah password")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="px-4 pt-2 pb-6">
        <button onClick={onClose} className="inline-flex items-center gap-1 text-sm text-gray-500 mb-4">
          ← Kembali
        </button>
        <div className="text-center py-8">
          <p className="text-gray-900 font-semibold">Password Berhasil Diubah</p>
          <p className="text-gray-500 text-sm mt-1">Silakan login kembali dengan password baru</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-2 pb-6">
      <button onClick={onClose} className="inline-flex items-center gap-1 text-sm text-gray-500 mb-4">← Kembali</button>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Ubah Password</h2>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password Saat Ini</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent" placeholder="Masukkan password saat ini" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent" placeholder="Minimal 6 karakter" required minLength={6} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent" placeholder="Ulangi password baru" required minLength={6} />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-[var(--color-primary)] text-white rounded-xl py-3 font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition-transform">
          {loading ? "Menyimpan..." : "Ubah Password"}
        </button>
      </form>
    </div>
  )
}

export default function BorrowerPengaturanPage() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const [showChangePassword, setShowChangePassword] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate("/login", { replace: true })
  }

  if (showChangePassword) {
    return <ChangePasswordForm onClose={() => setShowChangePassword(false)} />
  }

  return (
    <div className="px-4 pt-4 pb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Pengaturan</h2>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Akun</p>
        </div>
        <SettingItem icon={<IconMail className="w-5 h-5" />} label="Email" subtitle={user?.email || "-"} />
        <div className="h-px bg-gray-100 ml-12" />
        <SettingItem icon={<IconShield className="w-5 h-5" />} label="Keamanan" subtitle="Ubah password" onClick={() => setShowChangePassword(true)} />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <SettingItem icon={<IconLogOut className="w-5 h-5" />} label="Keluar" subtitle={user?.email} onClick={handleSignOut} danger />
      </div>
      <p className="text-center text-xs text-gray-300 mt-6">Amanah v1.0.0</p>
    </div>
  )
}