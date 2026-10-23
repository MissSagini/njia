CREATE TABLE "packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"price_kes" integer NOT NULL,
	"weeks" smallint NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "package_price_positive" CHECK ("packages"."price_kes" > 0)
);
--> statement-breakpoint
ALTER TABLE "packages" ENABLE ROW LEVEL SECURITY;