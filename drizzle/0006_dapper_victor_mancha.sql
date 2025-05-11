CREATE TABLE "assignment_submission_custom_values" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"submission_id" uuid NOT NULL,
	"custom_field_id" uuid NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "ascv_submission_field_unique" UNIQUE("submission_id","custom_field_id")
);
--> statement-breakpoint
ALTER TABLE "assignment_submission_custom_values" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "assignment_submission_custom_values" ADD CONSTRAINT "assignment_submission_custom_values_submission_id_assignment_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."assignment_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submission_custom_values" ADD CONSTRAINT "assignment_submission_custom_values_custom_field_id_assignment_custom_fields_id_fk" FOREIGN KEY ("custom_field_id") REFERENCES "public"."assignment_custom_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submission_custom_values" ADD CONSTRAINT "ascv_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."assignment_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submission_custom_values" ADD CONSTRAINT "ascv_custom_field_id_fkey" FOREIGN KEY ("custom_field_id") REFERENCES "public"."assignment_custom_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "Users can manage their own custom submission values" ON "assignment_submission_custom_values" AS PERMISSIVE FOR ALL TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM assignment_submissions sub
  WHERE ((sub.id = submission_id) AND (sub.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM assignment_submissions sub
  WHERE ((sub.id = submission_id) AND (sub.user_id = auth.uid())))));--> statement-breakpoint
CREATE POLICY "Lecturers and admins can view all custom submission values" ON "assignment_submission_custom_values" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.id = auth.uid()) AND (user_roles.role = ANY (ARRAY['lecturer'::text, 'admin'::text]))))));