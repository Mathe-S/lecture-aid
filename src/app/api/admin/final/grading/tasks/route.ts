import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { getUserRole } from "@/lib/userService";
import { db } from "@/db";
import { finalTasks } from "@/db/drizzle/final-schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    // Build where condition
    let whereCondition;
    if (groupId && groupId !== "all") {
      whereCondition = and(
        eq(finalTasks.status, "done"),
        eq(finalTasks.groupId, groupId)
      );
    } else {
      whereCondition = eq(finalTasks.status, "done");
    }

    // Fetch tasks that need grading (status = 'done')
    const tasks = await db.query.finalTasks.findMany({
      where: whereCondition,
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
        grades: {
          with: {
            student: {
              columns: {
                id: true,
                email: true,
                fullName: true,
                avatarUrl: true,
              },
            },
            grader: {
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
      orderBy: [finalTasks.updatedAt],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("[API_ADMIN_FINAL_GRADING_TASKS_GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks for grading" },
      { status: 500 }
    );
  }
}
