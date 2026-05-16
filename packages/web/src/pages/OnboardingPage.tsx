import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/use-auth"
import { IconUser, IconWallet, IconShield } from "../components/Icons"
import type { UserRole } from "@amanah/shared"

interface RoleOption {
  role: UserRole
  icon: React.FC<{ className?: string }>
  title: string
  subtitle: string
  description: string
  color: string
  bgLight: string
}

const roleOptions: RoleOption[] = [
  {
    role: "borrower",
    icon: IconUser,
    title: "Peminjam",
    subtitle: "Ajukan pinjaman kebajikan",
    description: "Dapatkan pinjaman tanpa bunga dari pemberi pinjaman terpercaya di komunitas.",
    color: "text-[var(--color-primary)]",
    bgLight: "bg-[var(--color-primary)]",
  },
  {
    role: "lender",
    icon: IconWallet,
    title: "Pemberi Pinjaman",
    subtitle: "Bantu sesama tanpa riba",
    description: "Catat dan kelola pinjaman kebajikan Anda dengan transparan dan aman.",
    color: "text-blue-600",
    bgLight: "bg-blue-600",
  },
  {
    role: "trustee",
    icon: IconShield,
    title: "Wali Amanah",
    subtitle: "Jaga amanah jaminan",
    description: "Menjadi pihak ketiga yang memegang dan mengembalikan jaminan peminjam.",
    color: "text-purple-600",
    bgLight: "bg-purple-600",
  },
]

export default function OnboardingPage() {
  const { setRole, user, hasNoRole } = useAuth()
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleContinue = async () => {
    if (!selectedRole) return
    setLoading(true)
    setError("")
    try {
      await setRole(selectedRole)
      if (selectedRole === "borrower") {
        navigate("/borrower/onboarding", { replace: true })
      } else if (selectedRole === "trustee") {
        navigate("/trustee/onboarding", { replace: true })
      } else {
        navigate("/dashboard", { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan peran")
    } finally {
      setLoading(false)
    }
  }

  if (!hasNoRole) {
    navigate(user?.role === "borrower" ? "/borrower" : user?.role === "trustee" ? "/trustee" : "/dashboard", { replace: true })
    return null
  }

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-slate-900 px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pilih Peran Anda</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-2 text-sm">
            Halo {user?.displayName || "Sahabat"}, pilih peran yang sesuai dengan kebutuhan Anda.
          </p>
        </div>

        {/* Role Cards */}
        <div className="space-y-3 mb-8">
          {roleOptions.map((option) => {
            const isSelected = selectedRole === option.role
            return (
              <button
                key={option.role}
                onClick={() => setSelectedRole(option.role)}
                className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
                  isSelected
                    ? "border-[var(--color-primary)] bg-white dark:bg-slate-800 shadow-md"
                    : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-600"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? option.bgLight : "bg-gray-100 dark:bg-slate-700"
                  }`}>
                    <option.icon className={`w-6 h-6 ${isSelected ? "text-white" : option.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100">{option.title}</h3>
                      {isSelected && (
                        <span className="text-xs bg-[var(--color-primary)] text-white px-2 py-0.5 rounded-full">
                          Dipilih
                        </span>
                      )}
                    </div>
                    <p className={`text-sm font-medium mt-0.5 ${isSelected ? "text-[var(--color-primary)]" : "text-gray-500 dark:text-slate-400"}`}>
                      {option.subtitle}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{option.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 mb-4 text-sm text-center">{error}</div>
        )}

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!selectedRole || loading}
          className="w-full bg-[var(--color-primary)] text-white rounded-xl py-3.5 font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {loading ? "Menyimpan..." : "Lanjutkan"}
        </button>

        {/* Info */}
        <p className="text-xs text-gray-400 dark:text-slate-500 text-center mt-4">
          Peran dapat diubah nanti melalui pengaturan akun.
        </p>
      </div>
    </div>
  )
}
