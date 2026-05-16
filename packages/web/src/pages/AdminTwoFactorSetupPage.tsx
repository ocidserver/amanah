import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/use-auth"
import { api } from "../lib/api"
import { IconShield, IconCheck, IconXCircle } from "../components/Icons"

export default function AdminTwoFactorSetupPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<"intro" | "setup" | "verify" | "success">("intro")
  const [secret, setSecret] = useState("")
  const [uri, setUri] = useState("")
  const [totpCode, setTotpCode] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [is2faEnabled, setIs2faEnabled] = useState(false)

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/dashboard", { replace: true })
      return
    }
    api.get<{ enabled: boolean; configured: boolean }>("/auth/2fa/status")
      .then((res) => {
        if (res.enabled) {
          setIs2faEnabled(true)
          setStep("success")
        } else if (res.configured) {
          setStep("verify")
        }
      })
      .catch(() => {})
  }, [user, navigate])

  const handleSetup = async () => {
    setError("")
    setLoading(true)
    try {
      const res = await api.post<{ secret: string; uri: string }>("/auth/2fa/setup", { password })
      setSecret(res.secret)
      setUri(res.uri)
      setStep("setup")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal setup 2FA")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setError("")
    setLoading(true)
    try {
      await api.post("/auth/2fa/enable", { totpCode })
      setStep("success")
      setIs2faEnabled(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kode 2FA tidak valid")
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async () => {
    setError("")
    setLoading(true)
    try {
      await api.post("/auth/2fa/disable", { password })
      setIs2faEnabled(false)
      setStep("intro")
      setError("2FA berhasil dinonaktifkan")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menonaktifkan 2FA")
    } finally {
      setLoading(false)
    }
  }

  if (step === "success") {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
            <IconCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">2FA Aktif</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-6">Autentikasi dua faktor telah diaktifkan untuk akun admin Anda.</p>
          <button
            onClick={() => navigate("/admin", { replace: true })}
            className="w-full bg-[var(--color-primary)] text-white rounded-xl py-3 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (step === "setup") {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-8">
          <div className="flex items-center gap-3 mb-6">
            <IconShield className="w-8 h-8 text-[var(--color-primary)]" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Setup 2FA</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Scan QR code dengan aplikasi authenticator</p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 mb-4 text-center">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`}
              alt="QR Code 2FA"
              className="mx-auto w-48 h-48"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Secret Key</label>
            <code className="block bg-gray-100 dark:bg-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-gray-900 dark:text-gray-100 select-all">
              {secret}
            </code>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 mb-4 text-sm" role="alert">{error}</div>
          )}

          <div className="mb-4">
            <label htmlFor="totp-code" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Masukkan 6-digit kode</label>
            <input
              id="totp-code"
              type="text"
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
              className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl px-4 py-3 text-base text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              placeholder="000000"
            />
          </div>

          <button
            onClick={handleVerify}
            disabled={loading || totpCode.length !== 6}
            className="w-full bg-[var(--color-primary)] text-white rounded-xl py-3 font-semibold disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]"
          >
            {loading ? "Memverifikasi..." : "Verifikasi & Aktifkan"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-8">
        <div className="flex items-center gap-3 mb-6">
          <IconShield className="w-8 h-8 text-[var(--color-primary)]" />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Autentikasi Dua Faktor</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">Amankan akun admin Anda</p>
          </div>
        </div>

        {is2faEnabled ? (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
              <IconCheck className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
              <p className="text-sm text-green-800 dark:text-green-300">2FA sudah aktif</p>
            </div>
            <div>
              <label htmlFor="disable-password" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Password untuk menonaktifkan</label>
              <input
                id="disable-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="Masukkan password"
              />
            </div>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm" role="alert">{error}</div>
            )}
            <button
              onClick={handleDisable}
              disabled={loading}
              className="w-full bg-red-600 text-white rounded-xl py-3 font-semibold disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
            >
              {loading ? "Menonaktifkan..." : "Nonaktifkan 2FA"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">2FA belum diaktifkan</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Disarankan untuk mengaktifkan 2FA demi keamanan akun admin.</p>
            </div>
            <div>
              <label htmlFor="setup-password" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Konfirmasi password</label>
              <input
                id="setup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="Masukkan password"
              />
            </div>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm" role="alert">{error}</div>
            )}
            <button
              onClick={handleSetup}
              disabled={loading || !password}
              className="w-full bg-[var(--color-primary)] text-white rounded-xl py-3 font-semibold disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]"
            >
              {loading ? "Menyiapkan..." : "Aktifkan 2FA"}
            </button>
          </div>
        )}

        <button
          onClick={() => navigate("/admin", { replace: true })}
          className="w-full mt-4 text-gray-500 dark:text-slate-400 text-sm font-medium hover:text-gray-700 dark:hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded py-2"
        >
          Kembali ke Dashboard
        </button>
      </div>
    </div>
  )
}
