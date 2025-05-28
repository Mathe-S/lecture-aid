import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { getUserRole } from "@/lib/userService";
import { db } from "@/db";
import { finalTasks } from "@/db/drizzle/final-schema";

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

    // Fetch all tasks with group and user details
    const allTasks = await db.query.finalTasks.findMany({
      with: {
        group: {
          columns: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          columns: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        assignees: {
          with: {
            user: {
              columns: {
                id: true,
                email: true,
                fullName: true,
                avatarUrl: true,
              },
            },
            assignedBy: {
              columns: {
                id: true,
                email: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: [finalTasks.createdAt],
    });

    return NextResponse.json(allTasks);
  } catch (error) {
    console.error("[API_ADMIN_FINAL_TASKS_GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch final project tasks" },
      { status: 500 }
    );
  }
}
