import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { api } from "../lib/api"
import { COLLATERAL_TYPE, INSTALLMENT_TYPE, LOAN_PURPOSE } from "@amanah/shared"
import type { ITrustee } from "@amanah/shared"
import { formatCurrency } from "../lib/utils"
import { useI18n } from "../hooks/use-i18n"

export default function PinjamanBaruPage() {
  const navigate = useNavigate()
  const { t, language } = useI18n()
  const [form, setForm] = useState({
    borrowerAlias: "Peminjam",
    borrowerEmail: "",
    amount: "",
    durationMonths: "1",
    installmentType: "monthly" as string,
    purpose: "urgent_needs" as string,
    collateralType: "none" as string,
    trusteeId: "",
    notes: "",
    hideBorrower: true,
    reminderEnabled: true,
    doaLunasEnabled: true,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [borrowerLookup, setBorrowerLookup] = useState<{ found: boolean; displayName: string | null; tier: string | null; maxAmount: number | null } | null>(null)
  const [lookingUpBorrower, setLookingUpBorrower] = useState(false)

  const { data: trusteesData } = useQuery({
    queryKey: ["trustees"],
    queryFn: () => api.get<{ trustees: ITrustee[] }>("/trustees"),
  })
  const trustees = trusteesData?.trustees ?? []

  const handleBorrowerEmailBlur = async () => {
    const email = form.borrowerEmail.trim()
    if (!email) {
      setBorrowerLookup(null)
      return
    }
    setLookingUpBorrower(true)
    try {
      const data = await api.get<{ borrower: { id: string; displayName: string | null; borrowerTier: string | null; maxBorrowingAmount: number } | null }>(`/loans/search-borrower?email=${encodeURIComponent(email)}`)
      const borrowerData = data.borrower as { id: string; displayName: string | null; borrowerTier: string | null; maxBorrowingAmount: number } | null
      if (borrowerData) {
        setBorrowerLookup({ found: true, displayName: borrowerData.displayName, tier: borrowerData.borrowerTier, maxAmount: borrowerData.maxBorrowingAmount })
        if (!form.borrowerAlias || form.borrowerAlias === "Peminjam") {
          setForm((f) => ({ ...f, borrowerAlias: borrowerData.displayName || "Peminjam" }))
        }
      } else {
        setBorrowerLookup({ found: false, displayName: null, tier: null, maxAmount: null })
      }
    } catch {
      setBorrowerLookup(null)
    } finally {
      setLookingUpBorrower(false)
    }
  }

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
        purpose: form.purpose,
        collateralType: form.collateralType,
        hideBorrower: form.hideBorrower,
        reminderEnabled: form.reminderEnabled,
        doaLunasEnabled: form.doaLunasEnabled,
      }
      if (form.trusteeId) {
        payload.trusteeId = form.trusteeId
      }
      if (form.borrowerEmail.trim()) {
        payload.borrowerEmail = form.borrowerEmail.trim().toLowerCase()
      }
      if (form.notes.trim()) {
        payload.notesEncrypted = form.notes.trim()
      }
      const result = await api.post<{ loan: Record<string, unknown>; invitationSent?: boolean }>("/loans", payload)
      navigate("/pinjaman/baru/success", { state: { loan: result.loan, invitationSent: !!result.invitationSent, borrowerEmail: form.borrowerEmail.trim() } })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat pinjaman")
    } finally {
      setSubmitting(false)
    }
  }

  const purposeLabels: Record<string, string> = {
    business_capital: t("loan.business"),
    housing: t("loan.housing"),
    consumptive: t("loan.consumptive"),
    education: t("loan.education"),
    health: t("loan.health"),
    urgent_needs: t("loan.urgent"),
    family_needs: t("loan.family"),
    debt_payment: t("loan.debtPayment"),
  }

  const installmentLabels: Record<string, string> = {
    monthly: t("loan.monthly"),
    weekly: t("loan.weekly"),
    lump_sum: t("loan.lumpSum"),
    flexible: t("loan.flexible"),
  }

  const collateralLabels: Record<string, string> = {
    document: t("loan.document"),
    valuables: t("loan.valuables"),
    letter: t("loan.letter"),
    none: t("loan.none"),
  }

  return (
    <div className="px-4 pt-2 pb-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t("loan.newTitle")}</h2>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 mb-4 text-sm" role="alert">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="borrower-email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t("auth.email")} {t("loan.borrower")} <span className="text-gray-400 dark:text-slate-500 font-normal">(opsional)</span></label>
          <input
            id="borrower-email"
            type="email"
            value={form.borrowerEmail}
            onChange={(e) => { setForm({ ...form, borrowerEmail: e.target.value }); if (!e.target.value.trim()) setBorrowerLookup(null) }}
            onBlur={handleBorrowerEmailBlur}
            className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            placeholder="peminjam@email.com"
          />
          {lookingUpBorrower && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1" role="status">{t("common.loading")}</p>}
          {borrowerLookup?.found && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Akun ditemukan: <strong>{borrowerLookup.displayName || "Tanpa Nama"}</strong>
              {borrowerLookup.tier && ` (${borrowerLookup.tier})`}
              {borrowerLookup.maxAmount && ` — Maks. ${formatCurrency(borrowerLookup.maxAmount)}`}
            </p>
          )}
          {borrowerLookup && !borrowerLookup.found && form.borrowerEmail.trim() && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Email belum terdaftar sebagai peminjam. Undangan akan dikirim setelah pinjaman dibuat.</p>
          )}
        </div>

        <div>
          <label htmlFor="borrower-alias" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t("loan.borrower")}</label>
          <input
            id="borrower-alias"
            type="text"
            value={form.borrowerAlias}
            onChange={(e) => setForm({ ...form, borrowerAlias: e.target.value })}
            className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            placeholder="Peminjam A"
          />
        </div>

        <div>
          <label htmlFor="loan-amount" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t("loan.amount")} (Rp)</label>
          <input
            id="loan-amount"
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            placeholder="1000000"
            required
          />
        </div>

        <div>
          <label htmlFor="loan-purpose" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t("loan.purpose")}</label>
          <select
            id="loan-purpose"
            value={form.purpose}
            onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          >
            {Object.entries(LOAN_PURPOSE).map(([key]) => (
              <option key={key} value={key}>{purposeLabels[key] || LOAN_PURPOSE[key as keyof typeof LOAN_PURPOSE]}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="loan-duration" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t("loan.duration")} ({t("loan.months")})</label>
          <input
            id="loan-duration"
            type="number"
            value={form.durationMonths}
            onChange={(e) => setForm({ ...form, durationMonths: e.target.value })}
            className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            min={1}
            max={60}
            required
          />
        </div>

        <div>
          <label htmlFor="loan-installment" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t("loan.installment")}</label>
          <select
            id="loan-installment"
            value={form.installmentType}
            onChange={(e) => setForm({ ...form, installmentType: e.target.value })}
            className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          >
            {Object.entries(INSTALLMENT_TYPE).map(([key]) => (
              <option key={key} value={key}>{installmentLabels[key] || INSTALLMENT_TYPE[key as keyof typeof INSTALLMENT_TYPE]}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="loan-collateral" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t("loan.collateral")}</label>
          <select
            id="loan-collateral"
            value={form.collateralType}
            onChange={(e) => setForm({ ...form, collateralType: e.target.value })}
            className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          >
            {Object.entries(COLLATERAL_TYPE).map(([key]) => (
              <option key={key} value={key}>{collateralLabels[key] || COLLATERAL_TYPE[key as keyof typeof COLLATERAL_TYPE]}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="loan-trustee" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t("loan.trustee")} <span className="text-gray-400 dark:text-slate-500 font-normal">(opsional)</span></label>
          <select
            id="loan-trustee"
            value={form.trusteeId}
            onChange={(e) => setForm({ ...form, trusteeId: e.target.value })}
            className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          >
            <option value="">{t("loan.none")}</option>
            {trustees.map((trustee) => (
              <option key={trustee.id} value={trustee.id}>{trustee.name}{trustee.type === "institution" ? ` (${trustee.institution || "Institusi"})` : ""}</option>
            ))}
          </select>
          {trustees.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{t("trustee.noTrustees")}. <a href="/wali-amanah/undang" className="text-[var(--color-primary)] underline">{t("trustee.invite")}</a></p>
          )}
        </div>

        <div>
          <label htmlFor="loan-notes" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t("common.detail")} <span className="text-gray-400 dark:text-slate-500 font-normal">(opsional)</span></label>
          <textarea
            id="loan-notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent resize-none"
            rows={3}
            placeholder="Catatan tambahan untuk pinjaman ini..."
            maxLength={500}
          />
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{form.notes.length}/500</p>
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-slate-300">
            <input type="checkbox" checked={form.hideBorrower} onChange={(e) => setForm({ ...form, hideBorrower: e.target.checked })} className="accent-[var(--color-primary)] w-4 h-4" />
            {language === "id" ? "Sembunyikan alias peminjam" : "Hide borrower alias"}
          </label>
          <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-slate-300">
            <input type="checkbox" checked={form.reminderEnabled} onChange={(e) => setForm({ ...form, reminderEnabled: e.target.checked })} className="accent-[var(--color-primary)] w-4 h-4" />
            {t("loan.reminder")}
          </label>
          <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-slate-300">
            <input type="checkbox" checked={form.doaLunasEnabled} onChange={(e) => setForm({ ...form, doaLunasEnabled: e.target.checked })} className="accent-[var(--color-primary)] w-4 h-4" />
            {t("loan.doaLunas")}
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[var(--color-primary)] text-white rounded-xl py-3 font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]"
        >
          {submitting ? `${t("common.saving")}` : t("loan.new")}
        </button>
      </form>
    </div>
  )
}
