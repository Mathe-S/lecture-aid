import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { leaveFinalGroup } from "@/lib/final-group-service";

export async function POST() {
  const supabase = await supabaseForServer();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = userData.user.id;

  try {
    await leaveFinalGroup(userId);
    return NextResponse.json(
      { message: "Successfully left group" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API_FINAL_GROUPS_LEAVE_POST] Error:", error);
    if (error instanceof Error) {
      if (error.message.includes("User is not in a final project group")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (
        error.message.includes(
          "Owner cannot leave the group while other members are present"
        )
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 }); // Bad Request or 409 Conflict
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "An unknown error occurred while leaving group" },
      { status: 500 }
    );
  }
}
