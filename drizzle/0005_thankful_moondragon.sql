DO $$ BEGIN
 CREATE TYPE "public"."sale_area" AS ENUM('Cível estadual', 'Cível federal', 'Penal', 'Previdenciário', 'Trabalhista', 'Tributário');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "sale_area" "sale_area";--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "indication" text;