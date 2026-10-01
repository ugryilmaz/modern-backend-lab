ALTER TABLE "outbox" DROP CONSTRAINT "outbox_id_unique";--> statement-breakpoint
ALTER TABLE "outbox" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "outbox" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "outbox" ADD COLUMN "event_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "outbox" ADD CONSTRAINT "outbox_event_id_unique" UNIQUE("event_id");