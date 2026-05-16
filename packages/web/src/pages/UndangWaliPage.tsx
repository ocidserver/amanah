import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"
import { COLLATERAL_TYPE } from "@amanah/shared"

export default function UndangWaliPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [type, setType] = useState<"personal" | "institution">("personal")
  const [institution, setInstitution] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      await api.post("/trustees", {
        name: name.trim(),
        type,
        email: email.trim() || undefined,
        institution: type === "institution" ? institution.trim() : undefined,
      })
      queryClient.invalidateQueries({ queryKey: ["trustees"] })
      navigate("/wali-amanah")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah wali amanah")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-4 pt-2 pb-8">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 dark:text-slate-400 mb-4 inline-block">← Kembali</button>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Tambah Wali Amanah</h2>
      <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
        Tambahkan wali amanah yang akan memegang jaminan pinjaman Anda.
      </p>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nama</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            placeholder="Nama wali amanah"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Jenis</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "personal" | "institution")}
            className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          >
            <option value="personal">Personal</option>
            <option value="institution">Institusi</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email (opsional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            placeholder="email@contoh.com"
          />
        </div>

        {type === "institution" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nama Institusi</label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              placeholder="Nama masjid / lembaga"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[var(--color-primary)] text-white rounded-xl py-3 font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {submitting ? "Menyimpan..." : "Tambah Wali Amanah"}
        </button>
      </form>
    </div>
  )
}
