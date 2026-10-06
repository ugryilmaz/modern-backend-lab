CREATE TYPE "public"."order_status" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED');--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "status" "order_status" DEFAULT 'PENDING' NOT NULL;