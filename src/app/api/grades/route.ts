import { NextResponse } from "next/server";
import { getStudentGrade, recalculateGrades } from "@/lib/gradesService";
import { supabaseForServer } from "@/utils/supabase/server";

export async function GET() {
  try {
    // Get the current user
    const supabase = await supabaseForServer();
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get grades and recalculate to ensure they're up to date
    await recalculateGrades(data.user.id);
    const grades = await getStudentGrade(data.user.id);

    return NextResponse.json(grades);
  } catch (error) {
    console.error("Error fetching grades:", error);
    return NextResponse.json(
      { error: "Failed to fetch grades" },
      { status: 500 }
    );
  }
}
