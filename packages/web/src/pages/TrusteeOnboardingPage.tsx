import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { api } from "../lib/api"
import { useAuth } from "../hooks/use-auth"
import { IconShield, IconUpload, IconCheck, IconChevronRight } from "../components/Icons"

export default function TrusteeOnboardingPage() {
  const navigate = useNavigate()
  const { user, updateProfile, uploadKtp } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(1)
  const [name, setName] = useState(user?.displayName || "")
  const [phone, setPhone] = useState(user?.phone || "")
  const [idNumber, setIdNumber] = useState(user?.idNumber || "")
  const [address, setAddress] = useState(user?.address || "")
  const [occupation, setOccupation] = useState(user?.occupation || "")
  const [ktpFile, setKtpFile] = useState<File | null>(null)
  const [ktpPreview, setKtpPreview] = useState(user?.ktpDocumentUrl || "")
  const [type, setType] = useState<"personal" | "institution">("personal")
  const [email, setEmail] = useState(user?.email || "")
  const [institution, setInstitution] = useState("")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const handleKtpSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5MB")
      return
    }
    setKtpFile(file)
    setKtpPreview(URL.createObjectURL(file))
    setError("")
  }

  const handleSaveProfile = async () => {
    setError("")
    if (!name.trim()) { setError("Nama wajib diisi"); return }
    if (!phone.trim()) { setError("Nomor telepon wajib diisi"); return }
    if (!idNumber.trim()) { setError("NIK wajib diisi"); return }
    if (!address.trim()) { setError("Alamat wajib diisi"); return }
    if (!occupation.trim()) { setError("Pekerjaan wajib diisi"); return }
    if (!ktpFile && !user?.ktpDocumentUrl) { setError("Foto KTP wajib diupload"); return }

    setSaving(true)
    try {
      await updateProfile(name.trim())
      await api.patch("/auth/me", { phone: phone.trim(), idNumber: idNumber.trim(), address: address.trim(), occupation: occupation.trim() })

      if (ktpFile) {
        setUploading(true)
        await uploadKtp(ktpFile)
        setUploading(false)
      }

      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan profil")
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  const createTrusteeMutation = useMutation({
    mutationFn: () =>
      api.post<{ trustee: Record<string, unknown> }>("/trustees", {
        name: name.trim(),
        type,
        email: email.trim() || undefined,
        institution: type === "institution" ? institution.trim() : undefined,
      }),
    onSuccess: () => {
      navigate("/trustee", { replace: true })
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Gagal membuat profil wali amanah")
    },
  })

  const handleCreateTrustee = () => {
    setError("")
    if (type === "institution" && !institution.trim()) {
      setError("Nama institusi wajib diisi")
      return
    }
    createTrusteeMutation.mutate()
  }

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Header */}
      <div className="bg-[var(--color-primary)] text-white px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <IconShield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Profil Wali Amanah</h1>
              <p className="text-sm opacity-70">Lengkapi data untuk menjadi wali amanah</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex gap-2 mt-4">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-white" : "bg-white/30"}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-white" : "bg-white/30"}`} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>
        )}

        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Data Pribadi</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]" placeholder="Nama sesuai KTP" />
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat <span className="text-red-500">*</span></label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] resize-none" placeholder="Alamat lengkap" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pekerjaan <span className="text-red-500">*</span></label>
                <input type="text" value={occupation} onChange={(e) => setOccupation(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]" placeholder="Jenis pekerjaan" />
              </div>

              {/* KTP Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto KTP <span className="text-red-500">*</span></label>
                <input type="file" ref={fileInputRef} accept="image/jpeg,image/png,image/webp" onChange={handleKtpSelect} className="hidden" />
                {ktpPreview ? (
                  <div className="relative">
                    <img src={ktpPreview} alt="KTP" className="w-full h-40 object-cover rounded-xl border border-gray-200" />
                    <button
                      onClick={() => { setKtpFile(null); setKtpPreview(""); fileInputRef.current?.click() }}
                      className="absolute top-2 right-2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg"
                    >
                      Ganti Foto
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-xl py-8 flex flex-col items-center gap-2 hover:border-[var(--color-primary)] transition-colors"
                  >
                    <IconUpload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-500">Upload foto KTP</span>
                    <span className="text-xs text-gray-400">JPG, PNG, WebP (max 5MB)</span>
                  </button>
                )}
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving || uploading}
                className="w-full bg-[var(--color-primary)] text-white py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving || uploading ? "Menyimpan..." : "Lanjut"}
                <IconChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Profil Wali Amanah</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Wali <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType("personal")}
                    className={`py-3 rounded-xl text-sm font-medium border-2 transition-colors ${
                      type === "personal"
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    Pribadi
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("institution")}
                    className={`py-3 rounded-xl text-sm font-medium border-2 transition-colors ${
                      type === "institution"
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    Institusi
                  </button>
                </div>
              </div>

              {type === "institution" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Institusi <span className="text-red-500">*</span></label>
                  <input type="text" value={institution} onChange={(e) => setInstitution(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]" placeholder="Contoh: BMT Amanah Sejahtera" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(opsional)</span></label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]" placeholder="email@contoh.com" />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-900">Tanggung Jawab Wali Amanah</p>
                <ul className="text-xs text-blue-700 mt-2 space-y-1">
                  <li>• Menerima dan menyimpan jaminan dari peminjam</li>
                  <li>• Mengembalikan jaminan setelah pinjaman lunas</li>
                  <li>• Menjaga keamanan dan kerahasiaan jaminan</li>
                  <li>• Profil akan diverifikasi oleh admin BMT</li>
                </ul>
              </div>

              <button
                onClick={handleCreateTrustee}
                disabled={createTrusteeMutation.isPending}
                className="w-full bg-[var(--color-primary)] text-white py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {createTrusteeMutation.isPending ? "Menyimpan..." : "Simpan Profil"}
                <IconCheck className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
