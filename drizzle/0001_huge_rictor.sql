CREATE TYPE "public"."regime" AS ENUM('MTD', 'SA100');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('not_started', 'in_progress', 'awaiting_client', 'ready_to_file', 'filed');--> statement-breakpoint
CREATE TYPE "public"."submission_type" AS ENUM('q_1', 'q_2', 'q_3', 'q_4', 'eops', 'final_declaration');--> statement-breakpoint
ALTER TABLE "checklist_item" ALTER COLUMN "status" SET DATA TYPE "public"."status" USING "status"::"public"."status";--> statement-breakpoint
ALTER TABLE "mtd_submission" ALTER COLUMN "submission_type" SET DATA TYPE "public"."submission_type" USING "submission_type"::"public"."submission_type";--> statement-breakpoint
ALTER TABLE "mtd_submission" ALTER COLUMN "status" SET DATA TYPE "public"."status" USING "status"::"public"."status";--> statement-breakpoint
ALTER TABLE "tax_return" ALTER COLUMN "regime" SET DATA TYPE "public"."regime" USING "regime"::"public"."regime";--> statement-breakpoint
ALTER TABLE "tax_return" ALTER COLUMN "status" SET DATA TYPE "public"."status" USING "status"::"public"."status";--> statement-breakpoint
ALTER TABLE "mtd_submission" ADD COLUMN "practice_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "tax_return" ADD COLUMN "deadline" date NOT NULL;--> statement-breakpoint
ALTER TABLE "mtd_submission" ADD CONSTRAINT "mtd_submission_practice_id_practice_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practice"("id") ON DELETE no action ON UPDATE no action;