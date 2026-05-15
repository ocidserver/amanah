import { useState } from "react"
import { useAuth } from "../hooks/use-auth"
import { useNavigate } from "react-router-dom"
import { api } from "../lib/api"
import { IconLogOut, IconChevronRight, IconEdit, IconCheck, IconShield, IconMail } from "../components/Icons"
import { BORROWER_TIER_LABELS } from "@amanah/shared"
import type { BorrowerTier } from "@amanah/shared"

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

export default function BorrowerProfilPage() {
  const { signOut, user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [name, setName] = useState(user?.displayName || "")
  const [phone, setPhone] = useState(user?.phone || "")
  const [idNumber, setIdNumber] = useState(user?.idNumber || "")
  const [address, setAddress] = useState(user?.address || "")
  const [occupation, setOccupation] = useState(user?.occupation || "")
  const [saving, setSaving] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState("")
  const [pwSuccess, setPwSuccess] = useState(false)

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

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await api.patch("/auth/me", {
        displayName: name.trim() || undefined,
        phone: phone.trim() || undefined,
        idNumber: idNumber.trim() || undefined,
        address: address.trim() || undefined,
        occupation: occupation.trim() || undefined,
      })
      setEditingProfile(false)
      window.location.reload()
    } catch {} finally {
      setSaving(false)
    }
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

  const initial = (user?.displayName?.[0] || user?.email?.[0] || "A").toUpperCase()
  const tierLabel = user?.borrowerTier ? BORROWER_TIER_LABELS[user.borrowerTier as BorrowerTier] : "Peminjam Baru"
  const isProfileComplete = user?.profileCompleted

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
              <IconCheck className="w-6 h-6 text-green-600" />
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

  return (
    <div className="px-4 pt-4 pb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Profil</h2>

      {!isProfileComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
          <p className="text-amber-800 font-semibold text-sm">Lengkapi Profil</p>
          <p className="text-amber-700 text-xs mt-1">Lengkapi data profil Anda untuk bisa mengajukan pinjaman dan melakukan pengecekan BI.</p>
          <button
            onClick={() => setEditingProfile(true)}
            className="mt-2 bg-amber-600 text-white text-sm px-4 py-2 rounded-xl font-medium"
          >
            Lengkapi Sekarang
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
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
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveName() }}
                />
                <button onClick={handleSaveName} disabled={saving} className="text-sm text-[var(--color-primary)] font-medium disabled:opacity-50">
                  {saving ? "..." : "Simpan"}
                </button>
                <button onClick={() => { setEditing(false); setName(user?.displayName || "") }} className="text-sm text-gray-400">
                  Batal
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900 text-lg truncate">{user?.displayName || "Tanpa Nama"}</p>
                <button onClick={() => { setEditing(true); setName(user?.displayName || "") }} className="text-gray-400 hover:text-[var(--color-primary)]">
                  <IconEdit className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-block text-xs bg-[var(--color-primary)] text-white px-2 py-0.5 rounded-full font-medium">
                {tierLabel}
              </span>
              {isProfileComplete && (
                <span className="inline-flex items-center text-xs text-green-600">
                  <IconCheck className="w-3 h-3 mr-0.5" /> Profil Lengkap
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {editingProfile ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">Edit Data Profil</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIK / No. KTP</label>
              <input type="text" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="16 digit NIK" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Alamat lengkap" rows={2} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pekerjaan</label>
              <input type="text" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="Jenis pekerjaan" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSaveProfile} disabled={saving} className="flex-1 bg-[var(--color-primary)] text-white py-3 rounded-xl font-semibold disabled:opacity-50">
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
              <button onClick={() => setEditingProfile(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold">
                Batal
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
          {(user?.phone || user?.idNumber || user?.address || user?.occupation) ? (
            <div className="divide-y divide-gray-50">
              {user?.phone && (
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm text-gray-500">Telepon</span>
                  <span className="text-sm font-medium text-gray-900">{user.phone}</span>
                </div>
              )}
              {user?.idNumber && (
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm text-gray-500">NIK</span>
                  <span className="text-sm font-medium text-gray-900">{user.idNumber}</span>
                </div>
              )}
              {user?.occupation && (
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm text-gray-500">Pekerjaan</span>
                  <span className="text-sm font-medium text-gray-900">{user.occupation}</span>
                </div>
              )}
              {user?.address && (
                <div className="px-4 py-3">
                  <span className="text-sm text-gray-500 block">Alamat</span>
                  <span className="text-sm font-medium text-gray-900">{user.address}</span>
                </div>
              )}
              <button
                onClick={() => setEditingProfile(true)}
                className="w-full px-4 py-3 flex items-center justify-between text-[var(--color-primary)] active:bg-gray-50"
              >
                <span className="font-medium text-[15px]">Edit Data Profil</span>
                <IconChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingProfile(true)}
              className="w-full px-4 py-4 text-center text-[var(--color-primary)] font-medium"
            >
              Lengkapi Data Profil
            </button>
          )}
        </div>
      )}

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