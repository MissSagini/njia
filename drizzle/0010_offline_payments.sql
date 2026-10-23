ALTER TYPE "public"."payment_method" ADD VALUE 'bank_transfer';--> statement-breakpoint
ALTER TYPE "public"."payment_method" ADD VALUE 'cash';--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "recorded_by" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_profiles_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;