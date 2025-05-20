import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { removeMemberFromFinalGroup } from "@/lib/final-group-service";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ groupId: string; memberId: string }> }
) {
  const supabase = await supabaseForServer();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const currentUserId = userData.user.id;
  const { groupId, memberId: memberUserIdToRemove } = await params;

  if (!groupId || !memberUserIdToRemove) {
    return NextResponse.json(
      { error: "Group ID and Member ID are required" },
      { status: 400 }
    );
  }

  try {
    const updatedGroup = await removeMemberFromFinalGroup(
      groupId,
      memberUserIdToRemove,
      currentUserId
    );
    return NextResponse.json(updatedGroup, { status: 200 });
  } catch (error) {
    console.error("[API_FINAL_GROUPS_REMOVE_MEMBER_DELETE] Error:", error);
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: error.message }, { status: 403 }); // Forbidden
      }
      if (error.message.includes("Owner cannot remove themselves")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes("Member not found in this group")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "An unknown error occurred while removing member" },
      { status: 500 }
    );
  }
}
