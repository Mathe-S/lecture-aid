import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { getUserRole } from "@/lib/userService";
import { db } from "@/db";
import { feedbackTemplates } from "@/db/drizzle/final-schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  category: z
    .enum([
      "code_quality",
      "documentation",
      "testing",
      "implementation",
      "best_practices",
      "performance",
      "security",
      "ui_ux",
      "general",
    ])
    .optional(),
  content: z.string().min(1, "Content is required").optional(),
  isDefault: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
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

    const { templateId } = await params;

    // Fetch the specific template
    const template = await db.query.feedbackTemplates.findFirst({
      where: eq(feedbackTemplates.id, templateId),
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
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("[API_ADMIN_FINAL_FEEDBACK_TEMPLATE_GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback template" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
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

    const { templateId } = await params;

    // Check if template exists
    const existingTemplate = await db.query.feedbackTemplates.findFirst({
      where: eq(feedbackTemplates.id, templateId),
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateTemplateSchema.parse(body);

    // Update the template
    const updatedTemplate = await db
      .update(feedbackTemplates)
      .set({
        ...validatedData,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(feedbackTemplates.id, templateId))
      .returning();

    return NextResponse.json(updatedTemplate[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[API_ADMIN_FINAL_FEEDBACK_TEMPLATE_PUT] Error:", error);
    return NextResponse.json(
      { error: "Failed to update feedback template" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
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

    const { templateId } = await params;

    // Check if template exists and is not default
    const existingTemplate = await db.query.feedbackTemplates.findFirst({
      where: eq(feedbackTemplates.id, templateId),
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    if (existingTemplate.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete default templates" },
        { status: 400 }
      );
    }

    // Delete the template
    await db
      .delete(feedbackTemplates)
      .where(eq(feedbackTemplates.id, templateId));

    return NextResponse.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("[API_ADMIN_FINAL_FEEDBACK_TEMPLATE_DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete feedback template" },
      { status: 500 }
    );
  }
}
