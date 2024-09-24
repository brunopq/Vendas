DO $$ BEGIN
 CREATE TYPE "public"."areas" AS ENUM('TRABALHISTA', 'CÍVEL', 'PREVIDENCIÁRIO', 'TRIBUTÁRIO', 'PENAL');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."sell_type" AS ENUM('ATIVO', 'PASSIVO');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sales" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"date" date DEFAULT now(),
	"seller" char(12) NOT NULL,
	"sell_type" "sell_type" NOT NULL,
	"area" "areas" NOT NULL,
	"client" text NOT NULL,
	"adverse_party" text NOT NULL,
	"is_repurchase" boolean DEFAULT false,
	"estimated_value" numeric(16, 2),
	"comments" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	CONSTRAINT "users_name_unique" UNIQUE("name")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales" ADD CONSTRAINT "sales_seller_users_id_fk" FOREIGN KEY ("seller") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
