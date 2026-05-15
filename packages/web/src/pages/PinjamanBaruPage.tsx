import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { api } from "../lib/api"
import { COLLATERAL_TYPE, INSTALLMENT_TYPE } from "@amanah/shared"
import type { ITrustee } from "@amanah/shared"

export default function PinjamanBaruPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    borrowerAlias: "Peminjam",
    amount: "",
    durationMonths: "1",
    installmentType: "monthly" as string,
    collateralType: "none" as string,
    trusteeId: "",
    hideBorrower: true,
    reminderEnabled: true,
    doaLunasEnabled: true,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const { data: trusteesData } = useQuery({
    queryKey: ["trustees"],
    queryFn: () => api.get<{ trustees: ITrustee[] }>("/trustees"),
  })
  const trustees = trusteesData?.trustees ?? []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        borrowerAlias: form.borrowerAlias,
        amount: Number(form.amount),
        durationMonths: Number(form.durationMonths),
        installmentType: form.installmentType,
        collateralType: form.collateralType,
        hideBorrower: form.hideBorrower,
        reminderEnabled: form.reminderEnabled,
        doaLunasEnabled: form.doaLunasEnabled,
      }
      if (form.trusteeId) {
        payload.trusteeId = form.trusteeId
      }
      const result = await api.post<{ loan: Record<string, unknown> }>("/loans", payload)
      navigate("/pinjaman/baru/success", { state: { loan: result.loan } })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat pinjaman")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-4 pt-2 pb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Catat Pinjaman Baru</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alias Peminjam</label>
          <input
            type="text"
            value={form.borrowerAlias}
            onChange={(e) => setForm({ ...form, borrowerAlias: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            placeholder="Peminjam A"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
          <input
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            placeholder="1000000"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (bulan)</label>
          <input
            type="number"
            value={form.durationMonths}
            onChange={(e) => setForm({ ...form, durationMonths: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            min={1}
            max={60}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pola Cicilan</label>
          <select
            value={form.installmentType}
            onChange={(e) => setForm({ ...form, installmentType: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          >
            {Object.entries(INSTALLMENT_TYPE).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Jaminan</label>
          <select
            value={form.collateralType}
            onChange={(e) => setForm({ ...form, collateralType: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          >
            {Object.entries(COLLATERAL_TYPE).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Wali Amanah <span className="text-gray-400 font-normal">(opsional)</span></label>
          <select
            value={form.trusteeId}
            onChange={(e) => setForm({ ...form, trusteeId: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          >
            <option value="">Tanpa Wali Amanah</option>
            {trustees.map((t) => (
              <option key={t.id} value={t.id}>{t.name}{t.type === "institution" ? ` (${t.institution || "Institusi"})` : ""}</option>
            ))}
          </select>
          {trustees.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">Belum ada wali amanah. <a href="/wali-amanah/undang" className="text-[var(--color-primary)] underline">Undang sekarang</a></p>
          )}
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input type="checkbox" checked={form.hideBorrower} onChange={(e) => setForm({ ...form, hideBorrower: e.target.checked })} className="accent-[var(--color-primary)] w-4 h-4" />
            Sembunyikan alias peminjam
          </label>
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input type="checkbox" checked={form.reminderEnabled} onChange={(e) => setForm({ ...form, reminderEnabled: e.target.checked })} className="accent-[var(--color-primary)] w-4 h-4" />
            Aktifkan pengingat cicilan
          </label>
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input type="checkbox" checked={form.doaLunasEnabled} onChange={(e) => setForm({ ...form, doaLunasEnabled: e.target.checked })} className="accent-[var(--color-primary)] w-4 h-4" />
            Aktifkan doa lunas
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[var(--color-primary)] text-white rounded-xl py-3 font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {submitting ? "Menyimpan..." : "Buat Pinjaman"}
        </button>
      </form>
    </div>
  )
}