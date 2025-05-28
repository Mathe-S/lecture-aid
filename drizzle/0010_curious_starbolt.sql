ALTER TABLE "final_evaluations" ADD COLUMN "week1_score" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "final_evaluations" ADD COLUMN "week1_feedback" text;--> statement-breakpoint
ALTER TABLE "final_evaluations" ADD COLUMN "week1_github_contributions" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "final_evaluations" ADD COLUMN "week1_tasks_completed" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "final_evaluations" ADD COLUMN "week2_score" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "final_evaluations" ADD COLUMN "week2_feedback" text;--> statement-breakpoint
ALTER TABLE "final_evaluations" ADD COLUMN "week2_github_contributions" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "final_evaluations" ADD COLUMN "week2_tasks_completed" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "final_evaluations" ADD COLUMN "week3_score" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "final_evaluations" ADD COLUMN "week3_feedback" text;--> statement-breakpoint
ALTER TABLE "final_evaluations" ADD COLUMN "week3_github_contributions" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "final_evaluations" ADD COLUMN "week3_tasks_completed" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "final_evaluations" ADD COLUMN "week4_score" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "final_evaluations" ADD COLUMN "week4_feedback" text;--> statement-breakpoint
ALTER TABLE "final_evaluations" ADD COLUMN "week4_github_contributions" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "final_evaluations" ADD COLUMN "week4_tasks_completed" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "final_evaluations" ADD COLUMN "total_commits" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "final_evaluations" ADD COLUMN "total_lines_added" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "final_evaluations" ADD COLUMN "total_lines_deleted" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "final_evaluations" ADD COLUMN "last_github_sync" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "project_conceptualization_score";--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "technical_implementation_score";--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "innovation_complexity_score";--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "documentation_presentation_score";--> statement-breakpoint
ALTER TABLE "final_evaluations" DROP COLUMN "testing_polish_score";