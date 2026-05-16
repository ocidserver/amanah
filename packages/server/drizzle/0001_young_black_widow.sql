CREATE TYPE "public"."bi_check_status" AS ENUM('pending', 'approved', 'rejected', 'review');--> statement-breakpoint
CREATE TYPE "public"."borrower_tier" AS ENUM('baru', 'kecil', 'menengah', 'utama');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'expired');--> statement-breakpoint
CREATE TYPE "public"."lender_tier" AS ENUM('pemula', 'penolong', 'dermawan', 'mujir');--> statement-breakpoint
CREATE TYPE "public"."loan_purpose" AS ENUM('business_capital', 'home', 'consumables', 'education', 'health', 'urgent_needs', 'family_needs', 'debt_consolidation');--> statement-breakpoint
CREATE TYPE "public"."payment_proof_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."role_change_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TYPE "public"."collateral_status" ADD VALUE 'verified';--> statement-breakpoint
ALTER TYPE "public"."loan_status" ADD VALUE 'pending' BEFORE 'active';--> statement-breakpoint
ALTER TYPE "public"."loan_status" ADD VALUE 'approved' BEFORE 'active';--> statement-breakpoint
ALTER TYPE "public"."loan_status" ADD VALUE 'rejected';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'borrower' BEFORE 'trustee';--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"details" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bi_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "bi_check_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lender_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_id" uuid NOT NULL,
	"borrower_id" uuid NOT NULL,
	"lender_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"review" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lender_ratings_loan_id_unique" UNIQUE("loan_id")
);
--> statement-breakpoint
CREATE TABLE "loan_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_id" uuid NOT NULL,
	"borrower_email" text NOT NULL,
	"token" text NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "loan_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "payment_proofs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"installment_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"status" "payment_proof_status" DEFAULT 'pending' NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_proofs_installment_id_unique" UNIQUE("installment_id")
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_change_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"requested_role" "user_role" NOT NULL,
	"status" "role_change_status" DEFAULT 'pending' NOT NULL,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "loan_code" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "lender_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "hide_borrower" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "start_date" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "start_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "installments" ADD COLUMN "reminder_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "borrower_id" uuid;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "purpose" "loan_purpose" DEFAULT 'urgent_needs' NOT NULL;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "collateral_description" text;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "collateral_proof_url" text;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "application_note" text;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "ujrah" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "stamp_fee" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "admin_fee" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "custody_fee" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "total_fee" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "disbursed_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "transit_account" text;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "contract_url" text;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "approved_by" uuid;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "id_number" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "occupation" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ktp_document_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "totp_secret" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "borrower_tier" "borrower_tier";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lender_tier" "lender_tier";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "rating" numeric(3, 2);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "rating_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "on_time_percentage" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "completed_loans" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bi_checks" ADD CONSTRAINT "bi_checks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lender_ratings" ADD CONSTRAINT "lender_ratings_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lender_ratings" ADD CONSTRAINT "lender_ratings_borrower_id_users_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lender_ratings" ADD CONSTRAINT "lender_ratings_lender_id_users_id_fk" FOREIGN KEY ("lender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_invitations" ADD CONSTRAINT "loan_invitations_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_installment_id_installments_id_fk" FOREIGN KEY ("installment_id") REFERENCES "public"."installments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_change_requests" ADD CONSTRAINT "role_change_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_logs_admin_id" ON "audit_logs" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_entity_type" ON "audit_logs" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_entity_id" ON "audit_logs" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_admin_created" ON "audit_logs" USING btree ("admin_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_bi_checks_user_id" ON "bi_checks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_bi_checks_status" ON "bi_checks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_lender_ratings_loan_id" ON "lender_ratings" USING btree ("loan_id");--> statement-breakpoint
CREATE INDEX "idx_lender_ratings_borrower_id" ON "lender_ratings" USING btree ("borrower_id");--> statement-breakpoint
CREATE INDEX "idx_lender_ratings_lender_id" ON "lender_ratings" USING btree ("lender_id");--> statement-breakpoint
CREATE INDEX "idx_loan_invitations_loan_id" ON "loan_invitations" USING btree ("loan_id");--> statement-breakpoint
CREATE INDEX "idx_loan_invitations_email" ON "loan_invitations" USING btree ("borrower_email");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_loan_invitations_token" ON "loan_invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_loan_invitations_status" ON "loan_invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_password_reset_user_id" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_password_reset_token" ON "password_reset_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_payment_proofs_installment_id" ON "payment_proofs" USING btree ("installment_id");--> statement-breakpoint
CREATE INDEX "idx_payment_proofs_status" ON "payment_proofs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payment_proofs_verified_by" ON "payment_proofs" USING btree ("verified_by");--> statement-breakpoint
CREATE INDEX "idx_push_subscriptions_user_id" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_push_subscriptions_endpoint" ON "push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "idx_role_change_user_id" ON "role_change_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_role_change_status" ON "role_change_requests" USING btree ("status");--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_borrower_id_users_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_completion_messages_loan_id" ON "completion_messages" USING btree ("loan_id");--> statement-breakpoint
CREATE INDEX "idx_installments_loan_id" ON "installments" USING btree ("loan_id");--> statement-breakpoint
CREATE INDEX "idx_installments_status" ON "installments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_installments_due_date" ON "installments" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_installments_loan_status" ON "installments" USING btree ("loan_id","status");--> statement-breakpoint
CREATE INDEX "idx_loans_lender_id" ON "loans" USING btree ("lender_id");--> statement-breakpoint
CREATE INDEX "idx_loans_borrower_id" ON "loans" USING btree ("borrower_id");--> statement-breakpoint
CREATE INDEX "idx_loans_status" ON "loans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_loans_lender_status" ON "loans" USING btree ("lender_id","status");--> statement-breakpoint
CREATE INDEX "idx_loans_borrower_status" ON "loans" USING btree ("borrower_id","status");--> statement-breakpoint
CREATE INDEX "idx_loans_trustee_id" ON "loans" USING btree ("trustee_id");--> statement-breakpoint
CREATE INDEX "idx_loans_created_at" ON "loans" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_refresh_tokens_token" ON "refresh_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_trustee_requests_loan_id" ON "trustee_requests" USING btree ("loan_id");--> statement-breakpoint
CREATE INDEX "idx_trustee_requests_trustee_id" ON "trustee_requests" USING btree ("trustee_id");--> statement-breakpoint
CREATE INDEX "idx_trustee_requests_status" ON "trustee_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_trustee_requests_trustee_status" ON "trustee_requests" USING btree ("trustee_id","status");--> statement-breakpoint
CREATE INDEX "idx_trustees_profile_id" ON "trustees" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_trustees_created_by" ON "trustees" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_trustees_type" ON "trustees" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_users_borrower_tier" ON "users" USING btree ("borrower_tier");--> statement-breakpoint
CREATE INDEX "idx_users_lender_tier" ON "users" USING btree ("lender_tier");