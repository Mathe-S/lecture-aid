import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { joinFinalGroup } from "@/lib/final-group-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const supabase = await supabaseForServer();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = userData.user.id;
  const { groupId } = await params;

  if (!groupId) {
    return NextResponse.json(
      { error: "Group ID is required" },
      { status: 400 }
    );
  }

  try {
    const updatedGroup = await joinFinalGroup(groupId, userId);
    return NextResponse.json(updatedGroup, { status: 200 });
  } catch (error) {
    console.error("[API_FINAL_GROUPS_JOIN_POST] Error:", error);
    if (error instanceof Error) {
      if (error.message.includes("User is already in a final project group")) {
        return NextResponse.json({ error: error.message }, { status: 409 }); // Conflict
      }
      if (error.message.includes("Group not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      // Add more specific error handling if needed (e.g., group full)
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "An unknown error occurred while joining group" },
      { status: 500 }
    );
  }
}
