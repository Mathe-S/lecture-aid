CREATE TABLE "final_task_assignees" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"assigned_by_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "final_task_assignees_task_user_unique" UNIQUE("task_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "final_tasks" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "final_tasks" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();--> statement-breakpoint
ALTER TABLE "final_tasks" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "final_tasks" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "final_tasks" ADD COLUMN "title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "final_tasks" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "final_tasks" ADD COLUMN "priority" text DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "final_tasks" ADD COLUMN "status" text DEFAULT 'todo' NOT NULL;--> statement-breakpoint
ALTER TABLE "final_tasks" ADD COLUMN "due_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "final_tasks" ADD COLUMN "estimated_hours" integer;--> statement-breakpoint
ALTER TABLE "final_tasks" ADD COLUMN "created_by_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "final_task_assignees" ADD CONSTRAINT "final_task_assignees_task_id_final_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."final_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_task_assignees" ADD CONSTRAINT "final_task_assignees_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_task_assignees" ADD CONSTRAINT "final_task_assignees_assigned_by_id_profiles_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "final_task_assignees_task_id_idx" ON "final_task_assignees" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "final_task_assignees_user_id_idx" ON "final_task_assignees" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "final_tasks" ADD CONSTRAINT "final_tasks_created_by_id_profiles_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "final_tasks_group_id_idx" ON "final_tasks" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "final_tasks_status_idx" ON "final_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "final_tasks_priority_idx" ON "final_tasks" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "final_tasks_due_date_idx" ON "final_tasks" USING btree ("due_date");--> statement-breakpoint
ALTER TABLE "final_tasks" DROP COLUMN "phase";--> statement-breakpoint
ALTER TABLE "final_tasks" DROP COLUMN "step";--> statement-breakpoint
ALTER TABLE "final_tasks" DROP COLUMN "task_text";--> statement-breakpoint
ALTER TABLE "final_tasks" DROP COLUMN "is_checked";--> statement-breakpoint
ALTER TABLE "final_tasks" DROP COLUMN "order_index";--> statement-breakpoint
DROP POLICY "Group members can view tasks" ON "final_tasks" CASCADE;--> statement-breakpoint
DROP POLICY "Group members can manage tasks (insert, update, delete)" ON "final_tasks" CASCADE;