CREATE TYPE "public"."collateral_status" AS ENUM('pending', 'held', 'returned');--> statement-breakpoint
CREATE TYPE "public"."collateral_type" AS ENUM('document', 'valuables', 'letter', 'none');--> statement-breakpoint
CREATE TYPE "public"."installment_status" AS ENUM('unpaid', 'processing', 'paid');--> statement-breakpoint
CREATE TYPE "public"."installment_type" AS ENUM('monthly', 'weekly', 'lump_sum', 'flexible');--> statement-breakpoint
CREATE TYPE "public"."loan_status" AS ENUM('active', 'completed', 'defaulted', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."trustee_request_status" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint
CREATE TYPE "public"."trustee_type" AS ENUM('personal', 'institution');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('lender', 'trustee', 'admin');--> statement-breakpoint
CREATE TABLE "completion_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_id" uuid NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "completion_messages_loan_id_unique" UNIQUE("loan_id")
);
--> statement-breakpoint
CREATE TABLE "installments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_id" uuid NOT NULL,
	"period_label" text NOT NULL,
	"amount" integer NOT NULL,
	"due_date" date NOT NULL,
	"paid_at" timestamp with time zone,
	"status" "installment_status" DEFAULT 'unpaid' NOT NULL,
	"confirmed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_code" text NOT NULL,
	"lender_id" uuid NOT NULL,
	"borrower_alias" text DEFAULT 'Peminjam' NOT NULL,
	"trustee_id" uuid,
	"amount" integer NOT NULL,
	"duration_months" integer NOT NULL,
	"installment_type" "installment_type" DEFAULT 'monthly' NOT NULL,
	"collateral_type" "collateral_type" DEFAULT 'none' NOT NULL,
	"collateral_status" "collateral_status" DEFAULT 'pending' NOT NULL,
	"notes_encrypted" text,
	"status" "loan_status" DEFAULT 'active' NOT NULL,
	"hide_borrower" boolean DEFAULT true NOT NULL,
	"reminder_enabled" boolean DEFAULT true NOT NULL,
	"doa_lunas_enabled" boolean DEFAULT true NOT NULL,
	"auto_delete_days" integer,
	"start_date" date DEFAULT now() NOT NULL,
	"due_date" date,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "loans_loan_code_unique" UNIQUE("loan_code")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "trustee_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_id" uuid NOT NULL,
	"trustee_id" uuid NOT NULL,
	"status" "trustee_request_status" DEFAULT 'pending' NOT NULL,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trustees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid,
	"name" text NOT NULL,
	"type" "trustee_type" NOT NULL,
	"email" text,
	"institution" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'lender' NOT NULL,
	"display_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "completion_messages" ADD CONSTRAINT "completion_messages_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installments" ADD CONSTRAINT "installments_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_lender_id_users_id_fk" FOREIGN KEY ("lender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_trustee_id_trustees_id_fk" FOREIGN KEY ("trustee_id") REFERENCES "public"."trustees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trustee_requests" ADD CONSTRAINT "trustee_requests_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trustee_requests" ADD CONSTRAINT "trustee_requests_trustee_id_trustees_id_fk" FOREIGN KEY ("trustee_id") REFERENCES "public"."trustees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trustees" ADD CONSTRAINT "trustees_profile_id_users_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trustees" ADD CONSTRAINT "trustees_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;