import { NextRequest, NextResponse } from "next/server";
import { getTasksForGrading } from "@/lib/final-grading-service";
import { supabaseForServer } from "@/utils/supabase/server";
import { getUserRole } from "@/lib/userService";

export async function GET(request: NextRequest) {
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
