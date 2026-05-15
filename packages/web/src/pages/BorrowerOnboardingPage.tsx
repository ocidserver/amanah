import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { api } from "../lib/api"
import { useAuth } from "../hooks/use-auth"
import { IconChevronLeft, IconCheck, IconClock, IconShield } from "../components/Icons"

type Step = "profile" | "bi-check" | "done"

export default function BorrowerOnboardingPage() {
  const navigate = useNavigate()
  const { user, fetchProfile } = useAuth()
  const [step, setStep] = useState<Step>(user?.profileCompleted ? "bi-check" : "profile")

  // Profile form state
  const [displayName, setDisplayName] = useState(user?.displayName || "")
  const [phone, setPhone] = useState(user?.phone || "")
  const [idNumber, setIdNumber] = useState(user?.idNumber || "")
  const [address, setAddress] = useState(user?.address || "")
  const [occupation, setOccupation] = useState(user?.occupation || "")
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState("")

  // BI check state
  const [biStatus, setBiStatus] = useState<"none" | "pending" | "approved" | "rejected">("none")
  const [biLoading, setBiLoading] = useState(false)
  const [biError, setBiError] = useState("")

  const saveProfileMutation = useMutation({
    mutationFn: () =>
      api.patch("/auth/me", {
        displayName: displayName.trim() || undefined,
        phone: phone.trim() || undefined,
        idNumber: idNumber.trim() || undefined,
        address: address.trim() || undefined,
        occupation: occupation.trim() || undefined,
      }),
    onSuccess: async () => {
      await fetchProfile()
      setStep("bi-check")
    },
    onError: (err) => {
      setProfileError(err instanceof Error ? err.message : "Gagal menyimpan profil")
    },
  })

  const handleSaveProfile = () => {
    setProfileError("")
    if (!displayName.trim()) {
      setProfileError("Nama lengkap wajib diisi")
      return
    }
    if (!phone.trim()) {
      setProfileError("Nomor telepon wajib diisi")
      return
    }
    if (!idNumber.trim()) {
      setProfileError("NIK wajib diisi")
      return
    }
    if (!address.trim()) {
      setProfileError("Alamat wajib diisi")
      return
    }
    if (!occupation.trim()) {
      setProfileError("Pekerjaan wajib diisi")
      return
    }
    setProfileSaving(true)
    saveProfileMutation.mutate()
  }

  const handleBiCheck = async () => {
    setBiLoading(true)
    setBiError("")
    setBiStatus("pending")
    try {
      const data = await api.post<{ status: string; notes?: string }>("/borrower-app/bi-check", {})
      if (data.status === "approved") {
        setBiStatus("approved")
      } else if (data.status === "rejected") {
        setBiStatus("rejected")
      } else {
        setBiStatus("pending")
        setBiError("Pengecekan BI masih dalam proses. Silakan coba lagi nanti.")
      }
    } catch (err) {
      setBiStatus("none")
      setBiError(err instanceof Error ? err.message : "Gagal melakukan pengecekan BI")
    } finally {
      setBiLoading(false)
    }
  }

  const handleFinish = () => {
    navigate("/borrower", { replace: true })
  }

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Header */}
      <div className="bg-[var(--color-primary)] text-white px-4 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold">Lengkapi Profil Peminjam</h1>
          <p className="text-sm opacity-70 mt-0.5">Ikuti langkah berikut untuk bisa mengajukan pinjaman</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 text-sm font-medium ${
            step === "profile" ? "text-[var(--color-primary)]" : "text-green-600"
          }`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step === "profile" ? "bg-[var(--color-primary)] text-white" : "bg-green-100 text-green-700"
            }`}>
              {step === "profile" ? "1" : <IconCheck className="w-4 h-4" />}
            </div>
            <span className="hidden sm:inline">Profil</span>
          </div>
          <div className={`flex-1 h-0.5 ${step === "bi-check" || step === "done" ? "bg-green-400" : "bg-gray-200"}`} />
          <div className={`flex items-center gap-1.5 text-sm font-medium ${
            step === "bi-check" ? "text-[var(--color-primary)]" : step === "done" ? "text-green-600" : "text-gray-400"
          }`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step === "bi-check" ? "bg-[var(--color-primary)] text-white" : step === "done" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
            }`}>
              {step === "done" ? <IconCheck className="w-4 h-4" /> : "2"}
            </div>
            <span className="hidden sm:inline">BI Check</span>
          </div>
          <div className={`flex-1 h-0.5 ${step === "done" ? "bg-green-400" : "bg-gray-200"}`} />
          <div className={`flex items-center gap-1.5 text-sm font-medium ${
            step === "done" ? "text-green-600" : "text-gray-400"
          }`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step === "done" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
            }`}>
              3
            </div>
            <span className="hidden sm:inline">Selesai</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 pb-8">
        {step === "profile" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Data Diri</h2>
            <p className="text-sm text-gray-500 mb-4">Lengkapi data diri Anda untuk keperluan verifikasi dan dokumen.</p>

            {profileError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{profileError}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]" placeholder="Sesuai KTP" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon <span className="text-red-500">*</span></label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]" placeholder="08xxxxxxxxxx" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIK / No. KTP <span className="text-red-500">*</span></label>
                <input type="text" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]" placeholder="16 digit NIK" maxLength={16} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap <span className="text-red-500">*</span></label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] resize-none" placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pekerjaan <span className="text-red-500">*</span></label>
                <input type="text" value={occupation} onChange={(e) => setOccupation(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]" placeholder="Contoh: Pedagang, Karyawan, Wiraswasta" />
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={profileSaving}
                className="w-full bg-[var(--color-primary)] text-white py-3 rounded-xl font-semibold disabled:opacity-50"
              >
                {profileSaving ? "Menyimpan..." : "Simpan & Lanjutkan"}
              </button>
            </div>
          </div>
        )}

        {step === "bi-check" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Pengecekan BI</h2>
            <p className="text-sm text-gray-500 mb-4">
              Kami akan melakukan pengecekan riwayat kredit Anda melalui sistem BI Checking (SLIK OJK).
            </p>

            {biStatus === "none" && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <IconShield className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Mengapa perlu BI Checking?</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Pengecekan ini memastikan Anda tidak memiliki kredit macet di lembaga keuangan lain. Hasilnya menentukan batas pinjaman Anda.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {biError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{biError}</div>
            )}

            {biStatus === "none" && (
              <button
                onClick={handleBiCheck}
                disabled={biLoading}
                className="w-full bg-[var(--color-primary)] text-white py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {biLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Mengecek...
                  </>
                ) : (
                  "Cek BI Sekarang"
                )}
              </button>
            )}

            {biStatus === "pending" && (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-50 flex items-center justify-center">
                  <IconClock className="w-8 h-8 text-yellow-600" />
                </div>
                <p className="text-gray-900 font-semibold mb-1">Pengecekan Sedang Berjalan</p>
                <p className="text-gray-500 text-sm">Silakan tunggu beberapa saat...</p>
              </div>
            )}

            {biStatus === "approved" && (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
                  <IconCheck className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-green-800 font-semibold mb-1">BI Checking Berhasil!</p>
                <p className="text-green-700 text-sm mb-4">
                  Riwayat kredit Anda bersih. Anda bisa mengajukan pinjaman sekarang.
                </p>
                <button
                  onClick={() => setStep("done")}
                  className="bg-[var(--color-primary)] text-white px-8 py-3 rounded-xl font-semibold"
                >
                  Lanjutkan
                </button>
              </div>
            )}

            {biStatus === "rejected" && (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                  <IconClock className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-red-800 font-semibold mb-1">BI Checking Tidak Lolos</p>
                <p className="text-red-700 text-sm mb-4">
                  Terdapat catatan kredit yang perlu diperbaiki. Silakan hubungi admin untuk informasi lebih lanjut.
                </p>
                <button
                  onClick={handleBiCheck}
                  className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-semibold mr-2"
                >
                  Coba Lagi
                </button>
                <button
                  onClick={handleFinish}
                  className="bg-[var(--color-primary)] text-white px-8 py-3 rounded-xl font-semibold"
                >
                  Kembali
                </button>
              </div>
            )}
          </div>
        )}

        {step === "done" && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <IconCheck className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Profil Lengkap!</h2>
            <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto">
              Anda sudah bisa mengajukan pinjaman kebajikan. Selamat bergabung di Amanah!
            </p>
            <button
              onClick={handleFinish}
              className="bg-[var(--color-primary)] text-white px-8 py-3 rounded-xl font-semibold text-base"
            >
              Mulai Ajukan Pinjaman
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
