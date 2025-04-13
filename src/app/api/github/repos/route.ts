import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { getUserRepositories } from "@/lib/github-service";

export async function GET() {
  const supabase = await supabaseForServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const repositories = await getUserRepositories(session);
    return NextResponse.json(repositories);
  } catch (error) {
    console.error("Failed to fetch GitHub repositories:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch GitHub repositories",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
