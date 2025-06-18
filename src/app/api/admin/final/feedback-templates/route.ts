import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { getUserRole } from "@/lib/userService";
import { db } from "@/db";
import { feedbackTemplates } from "@/db/drizzle/final-schema";
import { z } from "zod";

const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum([
    "code_quality",
    "documentation",
    "testing",
    "implementation",
    "best_practices",
    "performance",
    "security",
    "ui_ux",
    "general",
  ]),
  content: z.string().min(1, "Content is required"),
  isDefault: z.boolean().default(false),
});

export async function GET() {
  const supabase = await supabaseForServer();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if user is admin
    const userRole = await getUserRole(userData.user.id);
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all feedback templates
    const templates = await db.query.feedbackTemplates.findMany({
      with: {
        createdBy: {
          columns: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [feedbackTemplates.createdAt],
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("[API_ADMIN_FINAL_FEEDBACK_TEMPLATES_GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const supabase = await supabaseForServer();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if user is admin
    const userRole = await getUserRole(userData.user.id);
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    // Create the feedback template
    const newTemplate = await db
      .insert(feedbackTemplates)
      .values({
        name: validatedData.name,
        category: validatedData.category,
        content: validatedData.content,
        isDefault: validatedData.isDefault,
        createdById: userData.user.id,
      })
      .returning();

    return NextResponse.json(newTemplate[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[API_ADMIN_FINAL_FEEDBACK_TEMPLATES_POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create feedback template" },
      { status: 500 }
    );
  }
}
