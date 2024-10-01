DO $$ BEGIN
 CREATE TYPE "public"."user_roles" AS ENUM('ADMIN', 'SELLER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "user_role" "user_roles" NOT NULL;