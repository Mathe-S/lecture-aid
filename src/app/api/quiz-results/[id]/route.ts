import { NextRequest, NextResponse } from "next/server";
import {
  getQuizResultDetails,
  deleteQuizResult,
} from "@/lib/quizResultService";
import { supabaseForServer } from "@/utils/supabase/server";
import db from "@/db";
import { userRoles } from "@/db/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Result ID is required" },
      { status: 400 }
    );
  }

  try {
    const resultDetails = await getQuizResultDetails(id);
    return NextResponse.json(resultDetails);
  } catch (error) {
    console.error("Error fetching result details:", error);
    return NextResponse.json(
      { error: "Failed to fetch result details" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Result ID is required" },
      { status: 400 }
    );
  }

  try {
    // Verify that the user is an admin
    const supabase = await supabaseForServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "No authenticated user found" },
        { status: 401 }
      );
    }

    const userRole = await db.query.userRoles.findFirst({
      where: eq(userRoles.id, user.id),
    });

    if (!userRole || userRole.role !== "admin") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await deleteQuizResult(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting result:", error);
    return NextResponse.json(
      { error: "Failed to delete result" },
      { status: 500 }
    );
  }
}
