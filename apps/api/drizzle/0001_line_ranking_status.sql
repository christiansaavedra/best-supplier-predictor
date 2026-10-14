CREATE TYPE "public"."ranking_status" AS ENUM('ranked', 'late', 'no_offers');--> statement-breakpoint
ALTER TABLE "request_lines" ADD COLUMN "ranking_status" "ranking_status";--> statement-breakpoint
ALTER TABLE "request_lines" ADD COLUMN "ranked_at" timestamp with time zone;