export type UserRole = "lender" | "borrower" | "trustee" | "admin"
export type LoanStatus = "pending" | "approved" | "active" | "completed" | "defaulted" | "cancelled" | "rejected"
export type InstallmentStatus = "unpaid" | "processing" | "paid"
export type CollateralType = "document" | "valuables" | "letter" | "none"
export type CollateralStatus = "pending" | "held" | "returned" | "verified"
export type InstallmentType = "monthly" | "weekly" | "lump_sum" | "flexible"
export type TrusteeType = "personal" | "institution"
export type TrusteeRequestStatus = "pending" | "accepted" | "declined"
export type LoanPurpose = "business_capital" | "home" | "consumables" | "education" | "health" | "urgent_needs" | "family_needs" | "debt_consolidation"
export type InvitationStatus = "pending" | "accepted" | "expired"
export type BorrowerTier = "baru" | "kecil" | "menengah" | "utama"
export type LenderTier = "pemula" | "penolong" | "dermawan" | "mujir"
export type BICheckStatus = "pending" | "approved" | "rejected" | "review"
export type PaymentProofStatus = "pending" | "verified" | "rejected"

export type TierLabel = {
  key: string
  label: string
  maxAmount?: number
}

export const BORROWER_TIERS: Record<BorrowerTier, TierLabel> = {
  baru: { key: "baru", label: "Peminjam Baru", maxAmount: 2_000_000 },
  kecil: { key: "kecil", label: "Peminjam Kecil", maxAmount: 5_000_000 },
  menengah: { key: "menengah", label: "Peminjam Menengah", maxAmount: 15_000_000 },
  utama: { key: "utama", label: "Peminjam Utama", maxAmount: 50_000_000 },
}

export const LENDER_TIERS: Record<LenderTier, TierLabel> = {
  pemula: { key: "pemula", label: "Pemula" },
  penolong: { key: "penolong", label: "Penolong" },
  dermawan: { key: "dermawan", label: "Dermawan" },
  mujir: { key: "mujir", label: "Mujir" },
}

export interface IUser {
  id: string
  email: string
  role: UserRole | null
  displayName: string | null
  phone: string | null
  idNumber: string | null
  address: string | null
  occupation: string | null
  ktpDocumentUrl: string | null
  profileCompleted: boolean
  isVerified: boolean
  borrowerTier: BorrowerTier | null
  lenderTier: LenderTier | null
  rating: string | null
  ratingCount: number
  onTimePercentage: string | null
  completedLoans: number
  createdAt: string
}

export interface ILoan {
  id: string
  loanCode: string | null
  lenderId: string | null
  borrowerId: string | null
  borrowerAlias: string
  trusteeId: string | null
  amount: number
  durationMonths: number
  installmentType: InstallmentType
  purpose: LoanPurpose
  collateralType: CollateralType
  collateralDescription: string | null
  collateralProofUrl: string | null
  collateralStatus: CollateralStatus
  notesEncrypted: string | null
  applicationNote: string | null
  status: LoanStatus
  hideBorrower: boolean
  reminderEnabled: boolean
  doaLunasEnabled: boolean
  autoDeleteDays: number | null
  ujrah: number
  stampFee: number
  adminFee: number
  custodyFee: number
  totalFee: number
  disbursedAmount: number
  transitAccount: string | null
  contractUrl: string | null
  approvedBy: string | null
  approvedAt: string | null
  startDate: string | null
  dueDate: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface IInstallment {
  id: string
  loanId: string
  periodLabel: string
  amount: number
  dueDate: string
  paidAt: string | null
  status: InstallmentStatus
  confirmedBy: string | null
  reminderSentAt: string | null
  createdAt: string
}

export interface ITrustee {
  id: string
  profileId: string | null
  name: string
  type: TrusteeType
  email: string | null
  institution: string | null
  isVerified: boolean
  createdBy: string
  createdAt: string
}

export interface ICompletionMessage {
  id: string
  loanId: string
  message: string
  createdAt: string
}

export interface ITrusteeRequest {
  id: string
  loanId: string
  trusteeId: string
  status: TrusteeRequestStatus
  respondedAt: string | null
  createdAt: string
}

export interface ILoanInvitation {
  id: string
  loanId: string
  borrowerEmail: string
  token: string
  status: InvitationStatus
  expiresAt: string
  createdAt: string
}

export interface ILenderRating {
  id: string
  loanId: string
  borrowerId: string
  lenderId: string
  rating: number
  review: string | null
  createdAt: string
}

export interface IRoleChangeRequest {
  id: string
  userId: string
  requestedRole: UserRole
  status: InvitationStatus
  reviewedAt: string | null
  createdAt: string
}

export interface IBorrowerProfile {
  id: string
  email: string
  displayName: string | null
  borrowerTier: BorrowerTier | null
  onTimePercentage: string | null
  completedLoans: number
}

export interface IBICheck {
  id: string
  userId: string
  status: BICheckStatus
  notes: string | null
  checkedAt: string | null
  createdAt: string
}

export interface IPaymentProof {
  id: string
  installmentId: string
  imageUrl: string
  status: PaymentProofStatus
  verifiedBy: string | null
  verifiedAt: string | null
  uploadedAt: string
  createdAt: string
}

export const MAX_COMPLETION_MESSAGE_LENGTH = 500
export const MAX_LOAN_DURATION_MONTHS = 60

export const LOAN_STATUS: Record<LoanStatus, string> = {
  pending: "Menunggu Persetujuan",
  approved: "Disetujui",
  active: "Aktif",
  completed: "Lunas",
  defaulted: "Gagal Bayar",
  cancelled: "Dibatalkan",
  rejected: "Ditolak",
}

export const INSTALLMENT_STATUS: Record<InstallmentStatus, string> = {
  unpaid: "Belum Bayar",
  processing: "Diproses",
  paid: "Lunas",
}

export const COLLATERAL_TYPE: Record<CollateralType, string> = {
  document: "Dokumen",
  valuables: "Barang Berharga",
  letter: "Surat Pernyataan",
  none: "Tanpa Jaminan",
}

export const COLLATERAL_STATUS: Record<CollateralStatus, string> = {
  pending: "Menunggu",
  held: "Dipegang",
  returned: "Dikembalikan",
  verified: "Terverifikasi",
}

export const INSTALLMENT_TYPE: Record<InstallmentType, string> = {
  monthly: "Bulanan",
  weekly: "Mingguan",
  lump_sum: "Sekali Bayar",
  flexible: "Fleksibel",
}

export const LOAN_PURPOSE: Record<LoanPurpose, string> = {
  business_capital: "Modal Usaha",
  home: "Perumahan",
  consumables: "Kebutuhan Konsumtif",
  education: "Pendidikan",
  health: "Kesehatan",
  urgent_needs: "Kebutuhan Mendesak",
  family_needs: "Kebutuhan Keluarga",
  debt_consolidation: "Pelunasan Hutang",
}

export const BORROWER_TIER_LABELS: Record<BorrowerTier, string> = {
  baru: "Peminjam Baru",
  kecil: "Peminjam Kecil",
  menengah: "Peminjam Menengah",
  utama: "Peminjam Utama",
}

export const LENDER_TIER_LABELS: Record<LenderTier, string> = {
  pemula: "Pemula",
  penolong: "Penolong",
  dermawan: "Dermawan",
  mujir: "Mujir",
}

export const COLORS = {
  primary: "#1B4332",
  primaryLight: "#2D6A4F",
  success: "#40916C",
  warning: "#F59E0B",
  danger: "#DC2626",
  background: "#FFFFFF",
  surface: "#F8FAFC",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
}

export const BI_CHECK_STATUS: Record<BICheckStatus, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
  review: "Dalam Review",
}

export const PAYMENT_PROOF_STATUS: Record<PaymentProofStatus, string> = {
  pending: "Menunggu Verifikasi",
  verified: "Terverifikasi",
  rejected: "Ditolak",
}

export const FEE_CONFIG = {
  ujrahRate: 0.01,
  ujrahMin: 10_000,
  stampFee: 10_000,
  adminFee: 25_000,
  custodyRate: 0.005,
  custodyMin: 5_000,
} as const