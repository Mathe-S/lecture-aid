import { NextRequest, NextResponse } from "next/server";
import { getTasksForGrading } from "@/lib/final-grading-service";
import { supabaseForServer } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseForServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!userRole || userRole.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    // Get all tasks for grading and filter for appeal status
    const allTasks = await getTasksForGrading(groupId || undefined);
    const appealTasks = allTasks.filter((task) => task.status === "appeal");

    return NextResponse.json(appealTasks);
  } catch (error) {
    console.error("Error fetching appeal tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch appeal tasks" },
      { status: 500 }
    );
  }
}
