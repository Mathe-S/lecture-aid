import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { getUserRole } from "@/lib/userService";
import { db } from "@/db";
import {
  finalTasks,
  finalTaskGrades,
  finalGroupMembers,
} from "@/db/drizzle/final-schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const supabase = await supabaseForServer();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const userRole = await getUserRole(user.id);
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all students' final task scores
    // First, let's get all group members
    const allGroupMembers = await db
      .select({
        userId: finalGroupMembers.userId,
        groupId: finalGroupMembers.groupId,
      })
      .from(finalGroupMembers);

    console.log("All group members:", allGroupMembers.length);

    // Then get scores for each user
    const scores = await Promise.all(
      allGroupMembers.map(async (member) => {
        // Get all tasks for this user's group
        const groupTasks = await db
          .select({
            id: finalTasks.id,
          })
          .from(finalTasks)
          .where(eq(finalTasks.groupId, member.groupId));

        // Get graded tasks for this user
        const gradedTasks = await db
          .select({
            points: finalTaskGrades.points,
          })
          .from(finalTaskGrades)
          .innerJoin(finalTasks, eq(finalTaskGrades.taskId, finalTasks.id))
          .where(
            and(
              eq(finalTasks.groupId, member.groupId),
              eq(finalTaskGrades.studentId, member.userId)
            )
          );

        const totalPointsEarned = gradedTasks.reduce(
          (sum, task) => sum + (task.points || 0),
          0
        );

        return {
          userId: member.userId,
          totalPointsEarned,
          totalTasksGraded: gradedTasks.length,
          totalTasks: groupTasks.length,
        };
      })
    );

    console.log("Final scores:", scores);
    return NextResponse.json(scores);
  } catch (error) {
    console.error("Error fetching all final scores:", error);
    return NextResponse.json(
      { error: "Failed to fetch final scores" },
      { status: 500 }
    );
  }
}
