import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import db from "@/db";
import { assignments } from "@/db/drizzle/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the current user from the auth context
    const supabase = await supabaseForServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the user is an admin or lecturer
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      !userRole ||
      (userRole.role !== "admin" && userRole.role !== "lecturer")
    ) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Update the assignment to mark it as closed
    const [updatedAssignment] = await db
      .update(assignments)
      .set({
        closed: true,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(assignments.id, id))
      .returning();

    if (!updatedAssignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    console.error("Error closing assignment:", error);
    return NextResponse.json(
      { error: "Failed to close assignment" },
      { status: 500 }
    );
  }
}
