CREATE TABLE "midterm_contributions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"github_username" text,
	"commits" integer DEFAULT 0,
	"pull_requests" integer DEFAULT 0,
	"code_reviews" integer DEFAULT 0,
	"additions" integer DEFAULT 0,
	"deletions" integer DEFAULT 0,
	"branches_created" integer DEFAULT 0,
	"last_commit_date" timestamp with time zone,
	"contributionData" jsonb DEFAULT '{}'::jsonb,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "midterm_contributions_group_id_user_id_key" UNIQUE("group_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "midterm_contributions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "midterm_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"evaluator_id" uuid NOT NULL,
	"spec_score" integer DEFAULT 0,
	"test_score" integer DEFAULT 0,
	"implementation_score" integer DEFAULT 0,
	"documentation_score" integer DEFAULT 0,
	"git_workflow_score" integer DEFAULT 0,
	"total_score" integer DEFAULT 0,
	"feedback" text,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "midterm_evaluations_group_id_user_id_key" UNIQUE("group_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "midterm_evaluations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "midterm_group_members" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "midterm_group_members_group_id_user_id_key" UNIQUE("group_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "midterm_group_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "midterm_groups" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"repository_url" text,
	"repository_owner" text,
	"repository_name" text,
	"last_sync" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "midterm_groups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "midterm_repository_metrics" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"group_id" uuid NOT NULL,
	"total_commits" integer DEFAULT 0,
	"total_pull_requests" integer DEFAULT 0,
	"total_branches" integer DEFAULT 0,
	"total_issues" integer DEFAULT 0,
	"code_additions" integer DEFAULT 0,
	"code_deletions" integer DEFAULT 0,
	"contributors_count" integer DEFAULT 0,
	"last_updated" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"detailedMetrics" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
ALTER TABLE "midterm_repository_metrics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "midterm_contributions" ADD CONSTRAINT "midterm_contributions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."midterm_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "midterm_contributions" ADD CONSTRAINT "midterm_contributions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "midterm_evaluations" ADD CONSTRAINT "midterm_evaluations_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."midterm_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "midterm_evaluations" ADD CONSTRAINT "midterm_evaluations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "midterm_evaluations" ADD CONSTRAINT "midterm_evaluations_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "midterm_group_members" ADD CONSTRAINT "midterm_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."midterm_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "midterm_group_members" ADD CONSTRAINT "midterm_group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "midterm_repository_metrics" ADD CONSTRAINT "midterm_repository_metrics_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."midterm_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "Everyone can view contributions" ON "midterm_contributions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Users can view their own evaluations" ON "midterm_evaluations" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "Admins can view and create evaluations" ON "midterm_evaluations" AS PERMISSIVE FOR ALL TO "authenticated" USING ((EXISTS ( SELECT 1
        FROM user_roles
        WHERE ((user_roles.id = auth.uid()) AND (user_roles.role = 'admin'::text)))));--> statement-breakpoint
CREATE POLICY "Everyone can view group members" ON "midterm_group_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Users can join groups" ON "midterm_group_members" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "Users can leave groups" ON "midterm_group_members" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "Everyone can view midterm groups" ON "midterm_groups" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Users can create midterm groups" ON "midterm_groups" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Group members can update their group" ON "midterm_groups" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM midterm_group_members 
        WHERE midterm_group_members.group_id = midterm_groups.id 
        AND midterm_group_members.user_id = auth.uid()
      ));--> statement-breakpoint
CREATE POLICY "Everyone can view repository metrics" ON "midterm_repository_metrics" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);