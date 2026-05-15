import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  date,
  timestamp,
  numeric,
} from "drizzle-orm/pg-core"
import { pgEnum } from "drizzle-orm/pg-core"

export const userRoleEnum = pgEnum("user_role", ["lender", "borrower", "trustee", "admin"])
export const loanStatusEnum = pgEnum("loan_status", ["pending", "approved", "active", "completed", "defaulted", "cancelled", "rejected"])
export const installmentStatusEnum = pgEnum("installment_status", ["unpaid", "processing", "paid"])
export const collateralTypeEnum = pgEnum("collateral_type", ["document", "valuables", "letter", "none"])
export const collateralStatusEnum = pgEnum("collateral_status", ["pending", "held", "returned", "verified"])
export const installmentTypeEnum = pgEnum("installment_type", ["monthly", "weekly", "lump_sum", "flexible"])
export const trusteeTypeEnum = pgEnum("trustee_type", ["personal", "institution"])
export const trusteeRequestStatusEnum = pgEnum("trustee_request_status", ["pending", "accepted", "declined"])
export const loanPurposeEnum = pgEnum("loan_purpose", ["business_capital", "home", "consumables", "education", "health", "urgent_needs", "family_needs", "debt_consolidation"])
export const invitationStatusEnum = pgEnum("invitation_status", ["pending", "accepted", "expired"])
export const borrowerTierEnum = pgEnum("borrower_tier", ["baru", "kecil", "menengah", "utama"])
export const lenderTierEnum = pgEnum("lender_tier", ["pemula", "penolong", "dermawan", "mujir"])
export const biCheckStatusEnum = pgEnum("bi_check_status", ["pending", "approved", "rejected", "review"])
export const paymentProofStatusEnum = pgEnum("payment_proof_status", ["pending", "verified", "rejected"])

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").default("lender").notNull(),
  displayName: text("display_name"),
  phone: text("phone"),
  idNumber: text("id_number"),
  address: text("address"),
  occupation: text("occupation"),
  ktpDocumentUrl: text("ktp_document_url"),
  profileCompleted: boolean("profile_completed").default(false).notNull(),
  borrowerTier: borrowerTierEnum("borrower_tier"),
  lenderTier: lenderTierEnum("lender_tier"),
  rating: numeric("rating", { precision: 3, scale: 2 }),
  ratingCount: integer("rating_count").default(0).notNull(),
  onTimePercentage: numeric("on_time_percentage", { precision: 5, scale: 2 }),
  completedLoans: integer("completed_loans").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const trustees = pgTable("trustees", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: trusteeTypeEnum("type").notNull(),
  email: text("email"),
  institution: text("institution"),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const loans = pgTable("loans", {
  id: uuid("id").defaultRandom().primaryKey(),
  lenderId: uuid("lender_id").references(() => users.id),
  borrowerId: uuid("borrower_id").references(() => users.id),
  borrowerAlias: text("borrower_alias").default("Peminjam").notNull(),
  trusteeId: uuid("trustee_id").references(() => trustees.id),
  amount: integer("amount").notNull(),
  durationMonths: integer("duration_months").notNull(),
  installmentType: installmentTypeEnum("installment_type").default("monthly").notNull(),
  purpose: loanPurposeEnum("purpose").default("urgent_needs").notNull(),
  collateralType: collateralTypeEnum("collateral_type").default("none").notNull(),
  collateralStatus: collateralStatusEnum("collateral_status").default("pending").notNull(),
  notesEncrypted: text("notes_encrypted"),
  applicationNote: text("application_note"),
  status: loanStatusEnum("status").default("pending").notNull(),
  hideBorrower: boolean("hide_borrower").default(false).notNull(),
  reminderEnabled: boolean("reminder_enabled").default(true).notNull(),
  doaLunasEnabled: boolean("doa_lunas_enabled").default(true).notNull(),
  autoDeleteDays: integer("auto_delete_days"),
  ujrah: integer("ujrah").default(0).notNull(),
  stampFee: integer("stamp_fee").default(0).notNull(),
  adminFee: integer("admin_fee").default(0).notNull(),
  custodyFee: integer("custody_fee").default(0).notNull(),
  totalFee: integer("total_fee").default(0).notNull(),
  disbursedAmount: integer("disbursed_amount").default(0).notNull(),
  transitAccount: text("transit_account"),
  contractUrl: text("contract_url"),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  startDate: date("start_date"),
  dueDate: date("due_date"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
})

export const installments = pgTable("installments", {
  id: uuid("id").defaultRandom().primaryKey(),
  loanId: uuid("loan_id").references(() => loans.id, { onDelete: "cascade" }).notNull(),
  periodLabel: text("period_label").notNull(),
  amount: integer("amount").notNull(),
  dueDate: date("due_date").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  status: installmentStatusEnum("status").default("unpaid").notNull(),
  confirmedBy: text("confirmed_by"),
  reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const completionMessages = pgTable("completion_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  loanId: uuid("loan_id").references(() => loans.id, { onDelete: "cascade" }).notNull().unique(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const trusteeRequests = pgTable("trustee_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  loanId: uuid("loan_id").references(() => loans.id, { onDelete: "cascade" }).notNull(),
  trusteeId: uuid("trustee_id").references(() => trustees.id).notNull(),
  status: trusteeRequestStatusEnum("status").default("pending").notNull(),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const loanInvitations = pgTable("loan_invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  loanId: uuid("loan_id").references(() => loans.id, { onDelete: "cascade" }).notNull(),
  borrowerEmail: text("borrower_email").notNull(),
  token: text("token").notNull().unique(),
  status: invitationStatusEnum("status").default("pending").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const lenderRatings = pgTable("lender_ratings", {
  id: uuid("id").defaultRandom().primaryKey(),
  loanId: uuid("loan_id").references(() => loans.id, { onDelete: "cascade" }).notNull().unique(),
  borrowerId: uuid("borrower_id").references(() => users.id).notNull(),
  lenderId: uuid("lender_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(),
  review: text("review"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const roleChangeRequests = pgTable("role_change_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  requestedRole: userRoleEnum("requested_role").notNull(),
  status: invitationStatusEnum("status").default("pending").notNull(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const biChecks = pgTable("bi_checks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  status: biCheckStatusEnum("status").default("pending").notNull(),
  notes: text("notes"),
  checkedAt: timestamp("checked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const paymentProofs = pgTable("payment_proofs", {
  id: uuid("id").defaultRandom().primaryKey(),
  installmentId: uuid("installment_id").references(() => installments.id, { onDelete: "cascade" }).notNull().unique(),
  imageUrl: text("image_url").notNull(),
  status: paymentProofStatusEnum("status").default("pending").notNull(),
  verifiedBy: uuid("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})