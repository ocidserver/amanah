import { useState, useRef } from "react"
import { useAuth } from "../hooks/use-auth"
import { useNavigate } from "react-router-dom"
import { api } from "../lib/api"
import { IconLogOut, IconChevronRight, IconEdit, IconCheck, IconShield, IconMail, IconArrowRightLeft, IconUpload } from "../components/Icons"

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
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50 dark:active:bg-slate-700 transition-colors ${
        danger ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100"
      }`}
    >
      <span className={danger ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-slate-500"}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[15px]">{label}</p>
        {subtitle && <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{subtitle}</p>}
      </div>
      <IconChevronRight className="w-4 h-4 text-gray-300 dark:text-slate-600" />
    </button>
  )
}

export default function TrusteeProfilPage() {
  const { signOut, user, updateProfile, uploadKtp } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showRoleChange, setShowRoleChange] = useState(false)
  const [name, setName] = useState(user?.displayName || "")
  const [saving, setSaving] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState("")
  const [pwSuccess, setPwSuccess] = useState(false)
  const [roleChangeLoading, setRoleChangeLoading] = useState(false)
  const [roleChangeError, setRoleChangeError] = useState("")
  const [roleChangeSuccess, setRoleChangeSuccess] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate("/login", { replace: true })
  }

  const handleSaveName = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await updateProfile(name.trim())
      setEditing(false)
    } catch {} finally {
      setSaving(false)
    }
  }

  const handleKtpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await uploadKtp(file)
    } catch {}
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
      await api.post("/auth/role-change-request", { requestedRole: "lender" })
      setRoleChangeSuccess(true)
    } catch (err) {
      setRoleChangeError(err instanceof Error ? err.message : "Gagal mengirim permintaan")
    } finally {
      setRoleChangeLoading(false)
    }
  }

  const initial = (user?.displayName?.[0] || user?.email?.[0] || "A").toUpperCase()

  if (showChangePassword) {
    return (
      <div className="px-4 pt-4 pb-6">
        <button onClick={() => { setShowChangePassword(false); setPwSuccess(false) }} className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400 mb-4">
          <IconChevronRight className="w-4 h-4 rotate-180" /> Kembali
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Ubah Password</h2>
        {pwSuccess ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <IconCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-gray-900 dark:text-gray-100 font-semibold">Password Berhasil Diubah</p>
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            {pwError && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">{pwError}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Password Saat Ini</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" placeholder="Masukkan password saat ini" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Password Baru</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" placeholder="Minimal 6 karakter" required minLength={6} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Konfirmasi Password Baru</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" placeholder="Ulangi password baru" required minLength={6} />
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
        <button onClick={() => { setShowRoleChange(false); setRoleChangeSuccess(false); setRoleChangeError("") }} className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400 mb-4">
          <IconChevronRight className="w-4 h-4 rotate-180" /> Kembali
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Ubah Peran</h2>
        {roleChangeSuccess ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <IconArrowRightLeft className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-gray-900 dark:text-gray-100 font-semibold mb-1">Permintaan Terkirim</p>
            <p className="text-gray-500 dark:text-slate-400 text-sm">Admin akan meninjau permintaan Anda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-400">Ubah dari Wali Amanah ke Pemberi Pinjaman?</p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                Permintaan ini akan ditinjau oleh admin. Proses bisa memakan waktu 1-2 hari kerja.
              </p>
            </div>
            {roleChangeError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">{roleChangeError}</div>
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
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Profil</h2>

      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-2xl font-bold shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveName() }}
                />
                <button onClick={handleSaveName} disabled={saving} className="text-sm text-[var(--color-primary)] font-medium disabled:opacity-50">
                  {saving ? "..." : "Simpan"}
                </button>
                <button onClick={() => { setEditing(false); setName(user?.displayName || "") }} className="text-sm text-gray-400 dark:text-slate-500">
                  Batal
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg truncate">{user?.displayName || "Tanpa Nama"}</p>
                <button onClick={() => { setEditing(true); setName(user?.displayName || "") }} className="text-gray-400 dark:text-slate-500 hover:text-[var(--color-primary)]">
                  <IconEdit className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-sm text-gray-500 dark:text-slate-400 truncate">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              {user?.isVerified ? (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                  <IconCheck className="w-3 h-3" /> Terverifikasi BMT
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  <IconShield className="w-3 h-3" /> Menunggu Verifikasi
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KTP Document */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden mb-4">
        <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
          <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Dokumen</p>
        </div>
        <input type="file" ref={fileInputRef} accept="image/jpeg,image/png,image/webp" onChange={handleKtpUpload} className="hidden" />
        {user?.ktpDocumentUrl ? (
          <div className="p-4">
            <img src={user.ktpDocumentUrl} alt="KTP" className="w-full h-40 object-cover rounded-xl border border-gray-200 dark:border-slate-700 mb-2" />
            <button onClick={() => fileInputRef.current?.click()} className="text-sm text-[var(--color-primary)] font-medium">
              Ganti Foto KTP
            </button>
          </div>
        ) : (
          <button onClick={() => fileInputRef.current?.click()} className="w-full px-4 py-6 flex flex-col items-center gap-2 text-[var(--color-primary)] active:bg-gray-50 dark:active:bg-slate-700">
            <IconUpload className="w-6 h-6" />
            <span className="font-medium text-[15px]">Upload Foto KTP</span>
            <span className="text-xs text-gray-400 dark:text-slate-500">Wajib untuk verifikasi BMT</span>
          </button>
        )}
      </div>

      {/* Account Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden mb-4">
        <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
          <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Akun</p>
        </div>
        <SettingItem
          icon={<IconMail className="w-5 h-5" />}
          label="Email"
          subtitle={user?.email || "-"}
        />
        <div className="h-px bg-gray-100 dark:bg-slate-700 ml-12" />
        <SettingItem
          icon={<IconShield className="w-5 h-5" />}
          label="Keamanan"
          subtitle="Ubah password"
          onClick={() => setShowChangePassword(true)}
        />
        <div className="h-px bg-gray-100 dark:bg-slate-700 ml-12" />
        <SettingItem
          icon={<IconArrowRightLeft className="w-5 h-5" />}
          label="Ubah Peran"
          subtitle="Wali Amanah → Pemberi Pinjaman"
          onClick={() => setShowRoleChange(true)}
        />
      </div>

      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800 rounded-2xl py-3.5 font-medium active:scale-[0.98] transition-transform"
      >
        <IconLogOut className="w-4 h-4" />
        Keluar
      </button>
    </div>
  )
}
