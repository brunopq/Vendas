DROP TABLE "leads";--> statement-breakpoint
DROP TABLE "lead_status";--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "individual_prize" numeric(16, 2) DEFAULT '0' NOT NULL;