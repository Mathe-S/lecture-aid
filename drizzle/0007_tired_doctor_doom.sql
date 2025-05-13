CREATE TABLE "final_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"evaluator_id" uuid NOT NULL,
	"project_conceptualization_score" integer DEFAULT 0,
	"technical_implementation_score" integer DEFAULT 0,
	"innovation_complexity_score" integer DEFAULT 0,
	"documentation_presentation_score" integer DEFAULT 0,
	"testing_polish_score" integer DEFAULT 0,
	"total_score" integer DEFAULT 0,
	"feedback" text,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "final_evaluations_group_id_user_id_key" UNIQUE("group_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "final_evaluations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "final_group_members" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "final_group_members_group_id_user_id_key" UNIQUE("group_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "final_group_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "final_groups" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"selected_project_id" uuid,
	"repository_url" text,
	"repository_owner" text,
	"repository_name" text,
	"last_sync" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "final_groups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "final_projects" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"learning_objectives" jsonb DEFAULT '[]'::jsonb,
	"expected_deliverables" jsonb DEFAULT '[]'::jsonb,
	"resource_links" jsonb DEFAULT '[]'::jsonb,
	"project_tags" jsonb DEFAULT '[]'::jsonb,
	"created_by_admin_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "final_projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "final_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"phase" text NOT NULL,
	"step" text NOT NULL,
	"task_text" text NOT NULL,
	"is_checked" boolean DEFAULT false NOT NULL,
	"order_index" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "final_tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "final_evaluations" ADD CONSTRAINT "final_evaluations_group_id_final_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."final_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_evaluations" ADD CONSTRAINT "final_evaluations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_evaluations" ADD CONSTRAINT "final_evaluations_evaluator_id_users_id_fk" FOREIGN KEY ("evaluator_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_group_members" ADD CONSTRAINT "final_group_members_group_id_final_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."final_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_group_members" ADD CONSTRAINT "final_group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_groups" ADD CONSTRAINT "final_groups_selected_project_id_final_projects_id_fk" FOREIGN KEY ("selected_project_id") REFERENCES "public"."final_projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_projects" ADD CONSTRAINT "final_projects_created_by_admin_id_users_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_tasks" ADD CONSTRAINT "final_tasks_group_id_final_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."final_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "Users can view their own final evaluations" ON "final_evaluations" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "Admins can manage final evaluations" ON "final_evaluations" AS PERMISSIVE FOR ALL TO "authenticated" USING ((EXISTS ( SELECT 1
        FROM user_roles
        WHERE ((user_roles.id = auth.uid()) AND (user_roles.role = 'admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
        FROM user_roles
        WHERE ((user_roles.id = auth.uid()) AND (user_roles.role = 'admin'::text)))));--> statement-breakpoint
CREATE POLICY "Authenticated users can view final group members" ON "final_group_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Users can join final groups (insert)" ON "final_group_members" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "Users can leave final groups (delete)" ON "final_group_members" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "Authenticated users can view final groups" ON "final_groups" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Authenticated users can create final groups" ON "final_groups" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Group members can update their group" ON "final_groups" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM final_group_members
        WHERE final_group_members.group_id = "final_groups"."id"
        AND final_group_members.user_id = auth.uid()
      )) WITH CHECK (EXISTS (
        SELECT 1 FROM final_group_members
        WHERE final_group_members.group_id = "final_groups"."id"
        AND final_group_members.user_id = auth.uid()
      ));--> statement-breakpoint
CREATE POLICY "Group owners can delete their group" ON "final_groups" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM final_group_members
        WHERE final_group_members.group_id = "final_groups"."id"
        AND final_group_members.user_id = auth.uid()
        AND final_group_members.role = 'owner'::text
      ));--> statement-breakpoint
CREATE POLICY "Authenticated users can view final projects" ON "final_projects" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Admins can create, update, delete final projects" ON "final_projects" AS PERMISSIVE FOR ALL TO "authenticated" USING ((EXISTS ( SELECT 1
        FROM user_roles
        WHERE ((user_roles.id = auth.uid()) AND (user_roles.role = 'admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
        FROM user_roles
        WHERE ((user_roles.id = auth.uid()) AND (user_roles.role = 'admin'::text)))));--> statement-breakpoint
CREATE POLICY "Group members can view tasks" ON "final_tasks" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM final_group_members
        WHERE final_group_members.group_id = "final_tasks"."group_id"
        AND final_group_members.user_id = auth.uid()
      ));--> statement-breakpoint
CREATE POLICY "Group members can manage tasks (insert, update, delete)" ON "final_tasks" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (
        SELECT 1 FROM final_group_members
        WHERE final_group_members.group_id = "final_tasks"."group_id"
        AND final_group_members.user_id = auth.uid()
        AND (final_group_members.role = 'owner'::text OR final_group_members.role = 'member'::text)
      )) WITH CHECK (EXISTS (
        SELECT 1 FROM final_group_members
        WHERE final_group_members.group_id = "final_tasks"."group_id"
        AND final_group_members.user_id = auth.uid()
        AND (final_group_members.role = 'owner'::text OR final_group_members.role = 'member'::text)
      ));