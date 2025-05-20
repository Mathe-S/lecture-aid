import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { getUserFinalGroup } from "@/lib/final-group-service";

export async function GET() {
  const supabase = await supabaseForServer();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = userData.user.id;

  try {
    const group = await getUserFinalGroup(userId);

    if (!group) {
      return NextResponse.json(
        { error: "User is not in a final project group" },
        { status: 404 }
      );
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("[API_FINAL_GROUPS_MINE_GET] Error:", error);
    // It's unlikely getUserFinalGroup throws general errors other than DB connection issues
    // But handle it defensively
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "An unknown error occurred while fetching user group" },
      { status: 500 }
    );
  }
}
