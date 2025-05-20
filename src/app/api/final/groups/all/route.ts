import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { getAllFinalGroupsWithDetails } from "@/lib/final-group-service";

export async function GET() {
  // First, ensure the user is authenticated, even if all users can see the list.
  // This prevents unauthenticated API snooping.
  const supabase = await supabaseForServer();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allGroups = await getAllFinalGroupsWithDetails();
    return NextResponse.json(allGroups);
  } catch (error) {
    console.error("[API_FINAL_GROUPS_ALL_GET] Error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "An unknown error occurred while fetching all groups" },
      { status: 500 }
    );
  }
}
