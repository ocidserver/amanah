import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/use-auth"
import { api } from "../lib/api"
import { IconLogOut, IconChevronRight, IconShield, IconMail, IconArrowRightLeft } from "../components/Icons"

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
      <IconChevronRight className="w-4 h-4 text-gray-300" />
    </button>
  )
}

export default function PengaturanPage() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState("")
  const [pwSuccess, setPwSuccess] = useState(false)
  const [showRoleChange, setShowRoleChange] = useState(false)
  const [roleChangeLoading, setRoleChangeLoading] = useState(false)
  const [roleChangeError, setRoleChangeError] = useState("")
  const [roleChangeSuccess, setRoleChangeSuccess] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate("/login", { replace: true })
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError("")
    if (newPassword !== confirmPassword) { setPwError("Password baru tidak cocok"); return }
    if (newPassword.length < 6) { setPwError("Password minimal 6 karakter"); return }
    setPwLoading(true)
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword })
      setPwSuccess(true)
      setTimeout(() => { setShowChangePassword(false); setPwSuccess(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword("") }, 1500)
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Gagal mengubah password")
    } finally {
      setPwLoading(false)
    }
  }

  const handleRoleChange = async () => {
    setRoleChangeLoading(true)
    setRoleChangeError("")
    try {
      await api.post("/auth/role-change-request", { requestedRole: "borrower" })
      setRoleChangeSuccess(true)
    } catch (err) {
      setRoleChangeError(err instanceof Error ? err.message : "Gagal mengirim permintaan")
    } finally {
      setRoleChangeLoading(false)
    }
  }

  if (showChangePassword) {
    return (
      <div className="px-4 pt-4 pb-6">
        <button onClick={() => { setShowChangePassword(false); setPwSuccess(false) }} className="inline-flex items-center gap-1 text-sm text-gray-500 mb-4">
          <IconChevronRight className="w-4 h-4 rotate-180" /> Kembali
        </button>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Ubah Password</h2>
        {pwSuccess ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-50 flex items-center justify-center">
              <IconShield className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-gray-900 font-semibold">Password Berhasil Diubah</p>
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            {pwError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{pwError}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password Saat Ini</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" placeholder="Masukkan password saat ini" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" placeholder="Minimal 6 karakter" required minLength={6} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" placeholder="Ulangi password baru" required minLength={6} />
            </div>
            <button type="submit" disabled={pwLoading} className="w-full bg-[var(--color-primary)] text-white rounded-xl py-3 font-semibold disabled:opacity-50">
              {pwLoading ? "Menyimpan..." : "Ubah Password"}
            </button>
          </form>
        )}
      </div>
    )
  }

  if (showRoleChange) {
    return (
      <div className="px-4 pt-4 pb-6">
        <button onClick={() => { setShowRoleChange(false); setRoleChangeSuccess(false); setRoleChangeError("") }} className="inline-flex items-center gap-1 text-sm text-gray-500 mb-4">
          <IconChevronRight className="w-4 h-4 rotate-180" /> Kembali
        </button>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Ubah Peran</h2>
        {roleChangeSuccess ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-50 flex items-center justify-center">
              <IconArrowRightLeft className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-gray-900 font-semibold mb-1">Permintaan Terkirim</p>
            <p className="text-gray-500 text-sm">Admin akan meninjau permintaan Anda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm font-medium text-blue-900">Ubah dari Pemberi Pinjaman ke Peminjam?</p>
              <p className="text-xs text-blue-700 mt-1">
                Permintaan ini akan ditinjau oleh admin. Proses bisa memakan waktu 1-2 hari kerja.
              </p>
            </div>
            {roleChangeError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{roleChangeError}</div>
            )}
            <button
              onClick={handleRoleChange}
              disabled={roleChangeLoading}
              className="w-full bg-[var(--color-primary)] text-white rounded-xl py-3 font-semibold disabled:opacity-50"
            >
              {roleChangeLoading ? "Mengirim..." : "Kirim Permintaan"}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Pengaturan</h2>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Akun</p>
        </div>
        <SettingItem
          icon={<IconMail className="w-5 h-5" />}
          label="Email"
          subtitle={user?.email || "-"}
        />
        <div className="h-px bg-gray-100 ml-12" />
        <SettingItem
          icon={<IconShield className="w-5 h-5" />}
          label="Keamanan"
          subtitle="Ubah password"
          onClick={() => setShowChangePassword(true)}
        />
        <div className="h-px bg-gray-100 ml-12" />
        <SettingItem
          icon={<IconArrowRightLeft className="w-5 h-5" />}
          label="Ubah Peran"
          subtitle="Pemberi Pinjaman → Peminjam"
          onClick={() => setShowRoleChange(true)}
        />
      </div>

      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-100 rounded-2xl py-3.5 font-medium active:scale-[0.98] transition-transform"
      >
        <IconLogOut className="w-4 h-4" />
        Keluar
      </button>
    </div>
  )
}
