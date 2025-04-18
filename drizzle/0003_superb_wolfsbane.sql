CREATE TABLE "midterm_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"phase" text NOT NULL,
	"step" text NOT NULL,
	"task_text" text NOT NULL,
	"is_checked" boolean DEFAULT false NOT NULL,
	"order_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "midterm_tasks" ADD CONSTRAINT "midterm_tasks_group_id_midterm_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."midterm_groups"("id") ON DELETE cascade ON UPDATE no action;