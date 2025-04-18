import { NextRequest, NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import * as midtermService from "@/lib/midterm-service";

export async function GET() {
  const supabase = await supabaseForServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const groups = await midtermService.getMidtermGroupsWithProgress();
    return NextResponse.json(groups);
  } catch (error) {
    console.error("Failed to fetch midterm groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch midterm groups" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = await supabaseForServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    const group = await midtermService.createMidtermGroup(
      name,
      description || null,
      session.user.id
    );

    return NextResponse.json(group);
  } catch (error) {
    console.error("Failed to create midterm group:", error);
    return NextResponse.json(
      {
        error: "Failed to create midterm group",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
