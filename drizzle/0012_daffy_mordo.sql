CREATE TABLE "feedback_templates" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"content" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "final_task_grades" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"task_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"grader_id" uuid NOT NULL,
	"points" integer NOT NULL,
	"max_points" integer NOT NULL,
	"feedback" text,
	"graded_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "final_task_grades_task_student_unique" UNIQUE("task_id","student_id")
);
--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP CONSTRAINT "final_evaluations_evaluator_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "final_evaluations" ADD COLUMN "total_points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "final_evaluations" ADD COLUMN "overall_feedback" text;--> statement-breakpoint
ALTER TABLE "feedback_templates" ADD CONSTRAINT "feedback_templates_created_by_id_profiles_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_task_grades" ADD CONSTRAINT "final_task_grades_task_id_final_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."final_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_task_grades" ADD CONSTRAINT "final_task_grades_student_id_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_task_grades" ADD CONSTRAINT "final_task_grades_grader_id_profiles_id_fk" FOREIGN KEY ("grader_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feedback_templates_category_idx" ON "feedback_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "feedback_templates_created_by_idx" ON "feedback_templates" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "final_task_grades_task_id_idx" ON "final_task_grades" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "final_task_grades_student_id_idx" ON "final_task_grades" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "final_task_grades_grader_id_idx" ON "final_task_grades" USING btree ("grader_id");--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "evaluator_id";--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "week1_score";--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "week1_feedback";--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "week1_github_contributions";--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "week1_tasks_completed";--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "week2_score";--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "week2_feedback";--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "week2_github_contributions";--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "week2_tasks_completed";--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "week3_score";--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "week3_feedback";--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "week3_github_contributions";--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "week3_tasks_completed";--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "week4_score";--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "week4_feedback";--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "week4_github_contributions";--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "week4_tasks_completed";--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "total_commits";--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "total_lines_added";--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "total_lines_deleted";--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "last_github_sync";--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "total_score";--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "feedback";