ALTER TABLE "sales" ALTER COLUMN "is_repurchase" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "sales" ALTER COLUMN "is_repurchase" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ALTER COLUMN "estimated_value" SET NOT NULL;