import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import { api } from "../lib/api"
import { formatCurrency } from "../lib/utils"
import { LOAN_PURPOSE, FEE_CONFIG } from "@amanah/shared"
import type { LoanPurpose, InstallmentType, CollateralType } from "@amanah/shared"
import { IconChevronLeft, IconCheck, IconClock } from "../components/Icons"
import { useAuth } from "../hooks/use-auth"

export default function BorrowerApplyPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [amount, setAmount] = useState("")
  const [durationMonths, setDurationMonths] = useState("3")
  const [installmentType, setInstallmentType] = useState<InstallmentType>("monthly")
  const [purpose, setPurpose] = useState<LoanPurpose>("business_capital")
  const [collateralType, setCollateralType] = useState<CollateralType>("none")
  const [applicationNote, setApplicationNote] = useState("")
  const [step, setStep] = useState<"form" | "preview" | "success">("form")

  const { data: checkData, isLoading: checkLoading } = useQuery({
    queryKey: ["borrower-can-apply"],
    queryFn: () => api.get<{ canApply: boolean; reason?: string; maxBorrowingAmount?: number; borrowerTier?: string }>("/borrower-app/can-apply"),
  })

  const amountNum = parseInt(amount) || 0
  const durationNum = parseInt(durationMonths) || 1

  const ujrah = Math.max(Math.ceil(amountNum * FEE_CONFIG.ujrahRate), FEE_CONFIG.ujrahMin)
  const stampFee = FEE_CONFIG.stampFee
  const adminFee = FEE_CONFIG.adminFee
  const custodyFee = Math.max(Math.ceil(amountNum * FEE_CONFIG.custodyRate), FEE_CONFIG.custodyMin)
  const totalFee = ujrah + stampFee + adminFee + custodyFee
  const disbursedAmount = Math.max(amountNum - totalFee, 0)

  const applyMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post<{ loan: Record<string, unknown>; fees: Record<string, unknown> }>("/borrower-app/loans/apply", data),
    onSuccess: () => setStep("success"),
  })

  if (checkLoading) {
    return (
      <div className="px-4 pt-4 pb-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 dark:bg-slate-700 rounded w-40" />
          <div className="h-32 bg-gray-100 dark:bg-slate-700 rounded" />
        </div>
      </div>
    )
  }

  if (!checkData?.canApply) {
    return (
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/borrower")} className="p-1">
            <IconChevronLeft className="w-6 h-6 text-gray-600 dark:text-slate-400" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Ajukan Pinjaman</h1>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <IconClock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-amber-800 dark:text-amber-400 font-semibold mb-1">Belum bisa mengajukan pinjaman</p>
          <p className="text-amber-700 dark:text-amber-400 text-sm">{checkData?.reason || "Lengkapi profil dan lakukan pengecekan BI terlebih dahulu"}</p>
          <button
            onClick={() => navigate("/borrower/profil")}
            className="mt-4 bg-[var(--color-primary)] text-white px-6 py-2 rounded-xl font-semibold"
          >
            Lengkapi Profil
          </button>
        </div>
      </div>
    )
  }

  if (step === "success") {
    return (
      <div className="px-4 pt-4 pb-4">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <IconCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Pengajuan Terkirim!</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
            Pengajuan pinjaman Anda sedang menunggu persetujuan dari pemberi pinjaman.
          </p>
          <button
            onClick={() => navigate("/borrower")}
            className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-semibold"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    )
  }

  if (step === "preview") {
    return (
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setStep("form")} className="p-1">
            <IconChevronLeft className="w-6 h-6 text-gray-600 dark:text-slate-400" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Konfirmasi Pengajuan</h1>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Detail Pinjaman</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-500 dark:text-slate-400">Jumlah</span>
              <span className="font-semibold text-right text-gray-900 dark:text-gray-100">{formatCurrency(amountNum)}</span>
              <span className="text-gray-500 dark:text-slate-400">Durasi</span>
              <span className="font-semibold text-right text-gray-900 dark:text-gray-100">{durationNum} bulan</span>
              <span className="text-gray-500 dark:text-slate-400">Jenis Cicilan</span>
              <span className="font-semibold text-right text-gray-900 dark:text-gray-100">{installmentType === "monthly" ? "Bulanan" : installmentType === "weekly" ? "Mingguan" : "Fleksibel"}</span>
              <span className="text-gray-500 dark:text-slate-400">Tujuan</span>
              <span className="font-semibold text-right text-gray-900 dark:text-gray-100">{LOAN_PURPOSE[purpose]}</span>
              <span className="text-gray-500 dark:text-slate-400">Jaminan</span>
              <span className="font-semibold text-right text-gray-900 dark:text-gray-100">
                {collateralType === "none" ? "Tanpa Jaminan" : collateralType === "document" ? "Dokumen" : collateralType === "valuables" ? "Barang Berharga" : "Surat Pernyataan"}
              </span>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-4 space-y-2">
            <h3 className="font-semibold text-green-900 dark:text-green-400">Rincian Biaya</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-green-700 dark:text-green-400">Ujrah (1%)</span>
              <span className="font-semibold text-right text-green-900 dark:text-green-400">{formatCurrency(ujrah)}</span>
              <span className="text-green-700 dark:text-green-400">Materai</span>
              <span className="font-semibold text-right text-green-900 dark:text-green-400">{formatCurrency(stampFee)}</span>
              <span className="text-green-700 dark:text-green-400">Administrasi</span>
              <span className="font-semibold text-right text-green-900 dark:text-green-400">{formatCurrency(adminFee)}</span>
              <span className="text-green-700 dark:text-green-400">Penitipan Jaminan</span>
              <span className="font-semibold text-right text-green-900 dark:text-green-400">{formatCurrency(custodyFee)}</span>
              <span className="text-green-700 dark:text-green-400 font-semibold border-t border-green-200 dark:border-green-800 pt-2">Total Biaya</span>
              <span className="font-bold text-right text-green-900 dark:text-green-400 border-t border-green-200 dark:border-green-800 pt-2">{formatCurrency(totalFee)}</span>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 rounded-xl p-3 mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-800 dark:text-green-400 font-semibold">Dana diterima</span>
                <span className="text-green-900 dark:text-green-400 font-bold text-lg">{formatCurrency(disbursedAmount)}</span>
              </div>
            </div>
          </div>

          {applicationNote && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Catatan</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">{applicationNote}</p>
            </div>
          )}

          <button
            onClick={() => applyMutation.mutate({
              amount: amountNum,
              durationMonths: durationNum,
              installmentType,
              purpose,
              collateralType,
              applicationNote: applicationNote || undefined,
            })}
            disabled={applyMutation.isPending}
            className="w-full bg-[var(--color-primary)] text-white py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            {applyMutation.isPending ? "Mengirim..." : "Kirim Pengajuan"}
          </button>

          {applyMutation.isError && (
            <p className="text-red-500 dark:text-red-400 text-sm text-center">{(applyMutation.error as Error).message}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/borrower")} className="p-1">
          <IconChevronLeft className="w-6 h-6 text-gray-600 dark:text-slate-400" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Ajukan Pinjaman</h1>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Jumlah Pinjaman (Rp)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Contoh: 2000000"
            className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl text-lg font-semibold focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          />
          {checkData?.maxBorrowingAmount && (
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Maks: {formatCurrency(checkData.maxBorrowingAmount)}</p>
          )}
          {amountNum > 0 && (
            <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-3 mt-2 space-y-1">
              <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400">
                <span>Ujrah, materai, admin, penitipan</span>
                <span>{formatCurrency(totalFee)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-[var(--color-primary)]">
                <span>Dana diterima</span>
                <span>{formatCurrency(disbursedAmount)}</span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Durasi (bulan)</label>
          <select
            value={durationMonths}
            onChange={(e) => setDurationMonths(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl bg-white dark:bg-slate-700 focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            {[1, 2, 3, 4, 5, 6, 9, 12, 18, 24, 36].map((m) => (
              <option key={m} value={m}>{m} bulan</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Jenis Cicilan</label>
          <select
            value={installmentType}
            onChange={(e) => setInstallmentType(e.target.value as InstallmentType)}
            className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl bg-white dark:bg-slate-700 focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <option value="monthly">Bulanan</option>
            <option value="weekly">Mingguan</option>
            <option value="lump_sum">Sekali Bayar</option>
            <option value="flexible">Fleksibel</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tujuan Pinjaman</label>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value as LoanPurpose)}
            className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl bg-white dark:bg-slate-700 focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            {Object.entries(LOAN_PURPOSE).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Jenis Jaminan</label>
          <select
            value={collateralType}
            onChange={(e) => setCollateralType(e.target.value as CollateralType)}
            className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl bg-white dark:bg-slate-700 focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <option value="none">Tanpa Jaminan</option>
            <option value="document">Dokumen</option>
            <option value="valuables">Barang Berharga</option>
            <option value="letter">Surat Pernyataan</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Catatan (opsional)</label>
          <textarea
            value={applicationNote}
            onChange={(e) => setApplicationNote(e.target.value)}
            placeholder="Jelaskan kebutuhan pinjaman Anda..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
          />
        </div>

        <button
          onClick={() => setStep("preview")}
          disabled={!amount || amountNum < 100000}
          className="w-full bg-[var(--color-primary)] text-white py-3 rounded-xl font-semibold disabled:opacity-50"
        >
          Lanjutkan
        </button>
      </div>
    </div>
  )
}
