CREATE TABLE IF NOT EXISTS "origins" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "origin" char(12) NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales" ADD CONSTRAINT "sales_origin_origins_id_fk" FOREIGN KEY ("origin") REFERENCES "public"."origins"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "sales" DROP COLUMN IF EXISTS "sale_area";