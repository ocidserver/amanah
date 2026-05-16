import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { api } from "../lib/api"
import { IconShield, IconCheck, IconXCircle, IconMail } from "../components/Icons"

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<"verifying" | "success" | "error" | "resend">("verifying")
  const [message, setMessage] = useState("")
  const [resendLoading, setResendLoading] = useState(false)
  const [resendEmail, setResendEmail] = useState("")
  const [resendMessage, setResendMessage] = useState("")

  useEffect(() => {
    const token = searchParams.get("token")
    const emailParam = searchParams.get("email")
    if (emailParam) setResendEmail(emailParam)

    if (!token) {
      setStatus("resend")
      return
    }

    api.get<{ success: boolean; message: string; user: { email: string } }>(`/auth/verify-email?token=${token}`)
      .then((res) => {
        setStatus("success")
        setMessage(res.message)
        setResendEmail(res.user.email)
      })
      .catch((err) => {
        setStatus("error")
        setMessage(err instanceof Error ? err.message : "Token verifikasi tidak valid")
      })
  }, [searchParams])

  const handleResend = async () => {
    if (!resendEmail) return
    setResendLoading(true)
    setResendMessage("")
    try {
      await api.post("/auth/resend-verification", { email: resendEmail })
      setResendMessage("Email verifikasi berhasil dikirim ulang")
    } catch (err) {
      setResendMessage(err instanceof Error ? err.message : "Gagal mengirim ulang")
    } finally {
      setResendLoading(false)
    }
  }

  if (status === "verifying") {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
        <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center animate-pulse">
            <IconShield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Memverifikasi Email...</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm">Mohon tunggu sebentar</p>
        </div>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
        <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
            <IconCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Email Terverifikasi!</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">{message}</p>
          <button
            onClick={() => navigate("/login", { replace: true })}
            className="w-full bg-[var(--color-primary)] text-white rounded-xl py-3 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]"
          >
            Masuk ke Aplikasi
          </button>
        </div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
        <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <IconXCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Verifikasi Gagal</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">{message}</p>
          <button
            onClick={() => navigate("/login", { replace: true })}
            className="w-full bg-[var(--color-primary)] text-white rounded-xl py-3 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)] mb-3"
          >
            Kembali ke Login
          </button>
          <button
            onClick={() => setStatus("resend")}
            className="w-full text-gray-500 dark:text-slate-400 text-sm font-medium hover:text-gray-700 dark:hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded py-2"
          >
            Kirim Ulang Email Verifikasi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
          <IconMail className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Verifikasi Email</h2>
        <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
          Masukkan email Anda untuk menerima link verifikasi
        </p>

        {resendMessage && (
          <div className={`rounded-xl px-4 py-3 mb-4 text-sm ${
            resendMessage.includes("berhasil")
              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
              : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
          }`} role="alert">
            {resendMessage}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="email"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            placeholder="email@contoh.com"
            className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <button
            onClick={handleResend}
            disabled={resendLoading || !resendEmail}
            className="w-full bg-[var(--color-primary)] text-white rounded-xl py-3 font-semibold disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]"
          >
            {resendLoading ? "Mengirim..." : "Kirim Link Verifikasi"}
          </button>
        </div>

        <button
          onClick={() => navigate("/login", { replace: true })}
          className="w-full mt-4 text-gray-500 dark:text-slate-400 text-sm font-medium hover:text-gray-700 dark:hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded py-2"
        >
          Kembali ke Login
        </button>
      </div>
    </div>
  )
}
