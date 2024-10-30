ALTER TABLE "leads" ALTER COLUMN "asignee" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "origin" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lead_status" ADD COLUMN "is_default" boolean DEFAULT false;