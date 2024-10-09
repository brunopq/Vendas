ALTER TABLE "areas" RENAME TO "campaigns";--> statement-breakpoint
ALTER TABLE "sales" RENAME COLUMN "sell_type" TO "captation_type";--> statement-breakpoint
ALTER TABLE "sales" RENAME COLUMN "area" TO "campaign";--> statement-breakpoint
ALTER TABLE "campaigns" DROP CONSTRAINT "areas_name_unique";--> statement-breakpoint
ALTER TABLE "sales" DROP CONSTRAINT "sales_area_areas_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales" ADD CONSTRAINT "sales_campaign_campaigns_id_fk" FOREIGN KEY ("campaign") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_name_unique" UNIQUE("name");