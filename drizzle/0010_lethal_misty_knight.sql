CREATE TABLE IF NOT EXISTS "leads" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"asignee" char(12) NOT NULL,
	"date" date NOT NULL,
	"origin" text,
	"area" text,
	"name" text NOT NULL,
	"cpf" text,
	"birth_date" date NOT NULL,
	"phone_numbers" text[] NOT NULL,
	"extra_fields" json NOT NULL,
	"status" char(12) NOT NULL,
	"comments" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead_status" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"user" char(12) NOT NULL,
	"active" boolean NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leads" ADD CONSTRAINT "leads_asignee_users_id_fk" FOREIGN KEY ("asignee") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leads" ADD CONSTRAINT "leads_status_lead_status_id_fk" FOREIGN KEY ("status") REFERENCES "public"."lead_status"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lead_status" ADD CONSTRAINT "lead_status_user_users_id_fk" FOREIGN KEY ("user") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
