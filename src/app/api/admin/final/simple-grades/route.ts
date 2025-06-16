import { NextRequest, NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { getUserRole } from "@/lib/userService";
import {
  getStudentGradeSummary,
  getGroupFinalGrades,
  getSimpleGradeStats,
  updateStudentFinalGrade,
  recalculateAllFinalGrades,
} from "@/lib/simple-final-grades";

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
    const studentId = searchParams.get("studentId");

    if (groupId && studentId) {
      // Get specific student's grade summary
      const gradeSummary = await getStudentGradeSummary(studentId, groupId);
      return NextResponse.json({ gradeSummary });
    } else if (groupId) {
      // Get all students' grades for a group
      const groupGrades = await getGroupFinalGrades(groupId);
      return NextResponse.json({ groupGrades });
    } else {
      // Get overall statistics
      const stats = await getSimpleGradeStats();
      return NextResponse.json({ stats });
    }
  } catch (error) {
    console.error("[API_ADMIN_SIMPLE_GRADES_GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch grades" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { action, studentId, groupId, overallFeedback } = body;

    if (action === "recalculate") {
      // Recalculate all final grades
      await recalculateAllFinalGrades();
      return NextResponse.json({
        message: "All grades recalculated successfully",
      });
    }

    if (action === "update") {
      // Update specific student's final evaluation
      if (!studentId || !groupId) {
        return NextResponse.json(
          { error: "Student ID and Group ID are required" },
          { status: 400 }
        );
      }

      const evaluation = await updateStudentFinalGrade(
        studentId,
        groupId,
        overallFeedback
      );

      return NextResponse.json({ evaluation });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[API_ADMIN_SIMPLE_GRADES_POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to update grades" },
      { status: 500 }
    );
  }
}
