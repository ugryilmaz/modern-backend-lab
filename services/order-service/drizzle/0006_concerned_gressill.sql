ALTER TABLE "outbox" ADD COLUMN "locked_at" timestamp;--> statement-breakpoint
ALTER TABLE "outbox" ADD COLUMN "locked_by" varchar(255);