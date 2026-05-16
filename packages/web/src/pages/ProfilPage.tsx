import { useState } from "react"
import { useAuth } from "../hooks/use-auth"
import { useI18n } from "../hooks/use-i18n"
import { useNavigate } from "react-router-dom"
import { api } from "../lib/api"
import { IconLogOut, IconChevronRight, IconEdit, IconCheck, IconShield, IconMail, IconArrowRightLeft, IconStar, IconGlobe } from "../components/Icons"
import { LENDER_TIER_LABELS } from "@amanah/shared"
import type { LenderTier } from "@amanah/shared"

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "" }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 10) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) return { score: 1, label: "Lemah", color: "bg-red-500" }
  if (score <= 3) return { score: 2, label: "Cukup", color: "bg-amber-500" }
  if (score <= 4) return { score: 3, label: "Kuat", color: "bg-green-500" }
  return { score: 4, label: "Sangat Kuat", color: "bg-[#1B4332]" }
}

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
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50 dark:active:bg-slate-700 transition-colors focus:outline-none focus-visible:bg-gray-50 dark:focus-visible:bg-slate-700 ${
        danger ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100"
      }`}
    >
      <span className={danger ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-slate-500"} aria-hidden="true">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[15px]">{label}</p>
        {subtitle && <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{subtitle}</p>}
      </div>
      <IconChevronRight className="w-4 h-4 text-gray-300 dark:text-slate-600" aria-hidden="true" />
    </button>
  )
}

export default function ProfilPage() {
  const { signOut, user, updateProfile } = useAuth()
  const { t, language, setLanguage } = useI18n()
  const navigate = useNavigate()
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

  const initial = (user?.displayName?.[0] || user?.email?.[0] || "A").toUpperCase()
  const tierLabel = user?.lenderTier ? LENDER_TIER_LABELS[user.lenderTier as LenderTier] : "Pemula"
  const pwStrength = getPasswordStrength(newPassword)

  if (showChangePassword) {
    return (
      <div className="px-4 pt-4 pb-6">
        <button onClick={() => { setShowChangePassword(false); setPwSuccess(false) }} className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400 mb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded px-1 py-0.5">
          <IconChevronRight className="w-4 h-4 rotate-180" aria-hidden="true" /> {t("common.back")}
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t("auth.changePassword")}</h2>
        {pwSuccess ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center" aria-hidden="true">
              <IconCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-gray-900 dark:text-gray-100 font-semibold">{t("common.success")}</p>
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4" noValidate>
            {pwError && <div className="bg-red-50 dark:bg-red-900/20 dark:border-red-900/30 border border-red-200 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm" role="alert">{pwError}</div>}
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("auth.currentPassword")}</label>
              <input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" placeholder={t("auth.enterPassword")} required />
            </div>
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("auth.newPassword")}</label>
              <input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" placeholder="Minimal 6 karakter" required minLength={6} />
              {newPassword && (
                <div className="mt-2" aria-live="polite">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                        i <= pwStrength.score ? pwStrength.color : "bg-gray-200 dark:bg-slate-600"
                      }`} />
                    ))}
                  </div>
                  <p className={`text-xs ${
                    pwStrength.score <= 1 ? "text-red-500" :
                    pwStrength.score === 2 ? "text-amber-500" :
                    pwStrength.score === 3 ? "text-green-500" : "text-[#1B4332] dark:text-[#52B788]"
                  }`}>{pwStrength.label}</p>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("auth.confirmPassword")}</label>
              <input id="confirm-new-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" placeholder={t("auth.repeatPassword")} required minLength={6} />
              {confirmPassword && newPassword === confirmPassword && (
                <p className="text-xs text-green-500 dark:text-green-400 mt-1">Password cocok</p>
              )}
            </div>
            <button type="submit" disabled={pwLoading} className="w-full bg-[var(--color-primary)] text-white rounded-xl py-3 font-semibold disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]">
              {pwLoading ? `${t("common.saving")}` : t("auth.changePassword")}
            </button>
          </form>
        )}
      </div>
    )
  }

  if (showRoleChange) {
    return (
      <div className="px-4 pt-4 pb-6">
        <button onClick={() => { setShowRoleChange(false); setRoleChangeSuccess(false); setRoleChangeError("") }} className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400 mb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded px-1 py-0.5">
          <IconChevronRight className="w-4 h-4 rotate-180" aria-hidden="true" /> {t("common.back")}
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t("profile.changeRole")}</h2>
        {roleChangeSuccess ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center" aria-hidden="true">
              <IconArrowRightLeft className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-gray-900 dark:text-gray-100 font-semibold mb-1">{t("common.success")}</p>
            <p className="text-gray-500 dark:text-slate-400 text-sm">Admin akan meninjau permintaan Anda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900/30 border border-blue-200 rounded-xl p-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300">{t("profile.changeRole")}?</p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                Permintaan ini akan ditinjau oleh admin. Proses bisa memakan waktu 1-2 hari kerja.
              </p>
            </div>
            {roleChangeError && (
              <div className="bg-red-50 dark:bg-red-900/20 dark:border-red-900/30 border border-red-200 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm" role="alert">{roleChangeError}</div>
            )}
            <button
              onClick={handleRoleChange}
              disabled={roleChangeLoading}
              className="w-full bg-[var(--color-primary)] text-white rounded-xl py-3 font-semibold disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]"
            >
              {roleChangeLoading ? `${t("common.saving")}` : t("common.submit")}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t("nav.profile")}</h2>

      <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-2xl border border-gray-100 p-5 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-2xl font-bold shrink-0" aria-hidden="true">
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
                  aria-label={t("auth.displayName")}
                />
                <button onClick={handleSaveName} disabled={saving} className="text-sm text-[var(--color-primary)] font-medium disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded px-1">
                  {saving ? "..." : t("common.save")}
                </button>
                <button onClick={() => { setEditing(false); setName(user?.displayName || "") }} className="text-sm text-gray-400 dark:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded px-1">
                  {t("common.cancel")}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg truncate">{user?.displayName || "Tanpa Nama"}</p>
                <button onClick={() => { setEditing(true); setName(user?.displayName || "") }} className="text-gray-400 dark:text-slate-500 hover:text-[var(--color-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded p-0.5" aria-label={t("common.edit")}>
                  <IconEdit className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-sm text-gray-500 dark:text-slate-400 truncate">{user?.email}</p>
            <span className="inline-block mt-1 text-xs bg-[var(--color-primary)] text-white px-2 py-0.5 rounded-full font-medium">
              {tierLabel}
            </span>
            {user?.rating && parseFloat(user.rating) > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <IconStar className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{parseFloat(user.rating).toFixed(1)}</span>
                {user?.ratingCount && user.ratingCount > 0 && (
                  <span className="text-xs text-gray-400 dark:text-slate-500">({user.ratingCount} ulasan)</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 dark:border-slate-700 rounded-2xl border border-gray-100 overflow-hidden mb-4">
        <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800/50 dark:border-slate-700 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{t("profile.accountSettings")}</p>
        </div>
        <SettingItem
          icon={<IconMail className="w-5 h-5" />}
          label={t("auth.email")}
          subtitle={user?.email || "-"}
        />
        <div className="h-px bg-gray-100 dark:bg-slate-700 ml-12" />
        <SettingItem
          icon={<IconShield className="w-5 h-5" />}
          label={t("profile.security")}
          subtitle={t("auth.changePassword")}
          onClick={() => setShowChangePassword(true)}
        />
        <div className="h-px bg-gray-100 dark:bg-slate-700 ml-12" />
        <SettingItem
          icon={<IconArrowRightLeft className="w-5 h-5" />}
          label={t("profile.changeRole")}
          subtitle={`${t("role.lender")} → ${t("role.borrower")}`}
          onClick={() => setShowRoleChange(true)}
        />
        <div className="h-px bg-gray-100 dark:bg-slate-700 ml-12" />
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 dark:text-slate-500" aria-hidden="true"><IconGlobe className="w-5 h-5" /></span>
            <div>
              <p className="font-medium text-[15px] text-gray-900 dark:text-gray-100">{t("profile.language")}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">{language === "id" ? t("profile.indonesian") : t("profile.english")}</p>
            </div>
          </div>
          <div className="flex gap-1" role="radiogroup" aria-label={t("profile.language")}>
            {(["id", "en"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                role="radio"
                aria-checked={language === lang}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                  language === lang
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600"
                }`}
              >
                {lang === "id" ? "ID" : "EN"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-2xl py-3.5 font-medium active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      >
        <IconLogOut className="w-4 h-4" aria-hidden="true" />
        {t("auth.logout")}
      </button>
    </div>
  )
}
