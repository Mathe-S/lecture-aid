import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { getUserRole } from "@/lib/userService";
import { getStudentsForEvaluation } from "@/lib/final-evaluation-service";

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

    // Fetch all students in final groups
    const students = await getStudentsForEvaluation();

    return NextResponse.json(students);
  } catch (error) {
    console.error("[API_ADMIN_FINAL_STUDENTS_GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}
