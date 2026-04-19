ALTER TABLE "checklist_item" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "client" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "mtd_submission" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "practice" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "tax_return" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "checklist_item" ADD COLUMN "practice_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "checklist_item" ADD COLUMN "done" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "checklist_item" ADD CONSTRAINT "checklist_item_practice_id_practice_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practice"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_item" DROP COLUMN "status";