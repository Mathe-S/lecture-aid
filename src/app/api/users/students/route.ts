import { NextResponse } from "next/server";
import { getAllStudents } from "@/lib/userService";
import { supabaseForServer } from "@/utils/supabase/server";
import { getUserRole } from "@/lib/userService";

export async function GET() {
  try {
    // Get the current user
    const supabase = await supabaseForServer();
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify the user is an admin
    const role = await getUserRole(data.user.id);
    if (role !== "admin") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get all students
    const students = await getAllStudents();

    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}
