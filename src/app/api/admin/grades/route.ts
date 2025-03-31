import { NextRequest, NextResponse } from "next/server";
import {
  getAllStudentGrades,
  updateExtraPoints,
  recalculateGrades,
} from "@/lib/gradesService";
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

    // Verify the user is an admin or lecturer
    const role = await getUserRole(data.user.id);
    if (role !== "admin" && role !== "lecturer") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get all student grades
    const grades = await getAllStudentGrades();

    return NextResponse.json(grades);
  } catch (error) {
    console.error("Error fetching all grades:", error);
    return NextResponse.json(
      { error: "Failed to fetch grades" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the current user
    const supabase = await supabaseForServer();
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify the user is an admin or lecturer
    const role = await getUserRole(data.user.id);
    if (role !== "admin" && role !== "lecturer") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get request body
    const requestData = await request.json();

    // Validate request
    if (!requestData.userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (requestData.action === "updateExtraPoints") {
      if (typeof requestData.extraPoints !== "number") {
        return NextResponse.json(
          { error: "Invalid extraPoints value" },
          { status: 400 }
        );
      }

      await updateExtraPoints(requestData.userId, requestData.extraPoints);
    } else if (requestData.action === "recalculate") {
      await recalculateGrades(requestData.userId);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating grades:", error);
    return NextResponse.json(
      { error: "Failed to update grades" },
      { status: 500 }
    );
  }
}
