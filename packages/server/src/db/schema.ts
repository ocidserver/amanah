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
export const loanStatusEnum = pgEnum("loan_status", ["active", "completed", "defaulted", "cancelled"])
export const installmentStatusEnum = pgEnum("installment_status", ["unpaid", "processing", "paid"])
export const collateralTypeEnum = pgEnum("collateral_type", ["document", "valuables", "letter", "none"])
export const collateralStatusEnum = pgEnum("collateral_status", ["pending", "held", "returned"])
export const installmentTypeEnum = pgEnum("installment_type", ["monthly", "weekly", "lump_sum", "flexible"])
export const trusteeTypeEnum = pgEnum("trustee_type", ["personal", "institution"])
export const trusteeRequestStatusEnum = pgEnum("trustee_request_status", ["pending", "accepted", "declined"])
export const loanPurposeEnum = pgEnum("loan_purpose", ["business_capital", "home_repair", "consumables", "education", "health", "urgent_needs", "worship"])
export const invitationStatusEnum = pgEnum("invitation_status", ["pending", "accepted", "expired"])
export const borrowerTierEnum = pgEnum("borrower_tier", ["baru", "kecil", "menengah", "utama"])
export const lenderTierEnum = pgEnum("lender_tier", ["pemula", "penolong", "dermawan", "mujir"])

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").default("lender").notNull(),
  displayName: text("display_name"),
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
  lenderId: uuid("lender_id").references(() => users.id).notNull(),
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
  status: loanStatusEnum("status").default("active").notNull(),
  hideBorrower: boolean("hide_borrower").default(false).notNull(),
  reminderEnabled: boolean("reminder_enabled").default(true).notNull(),
  doaLunasEnabled: boolean("doa_lunas_enabled").default(true).notNull(),
  autoDeleteDays: integer("auto_delete_days"),
  startDate: date("start_date").defaultNow().notNull(),
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