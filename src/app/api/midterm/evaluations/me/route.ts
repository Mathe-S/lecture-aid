import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import * as midtermService from "@/lib/midterm-service";

export async function GET() {
  const supabase = await supabaseForServer();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Session error:", sessionError);
    return NextResponse.json(
      { error: "Server error checking session" },
      { status: 500 }
    );
  }

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const evaluations = await midtermService.getMidtermEvaluationsForUser(
      session.user.id
    );
    return NextResponse.json(evaluations);
  } catch (error) {
    console.error("Failed to fetch user midterm evaluations:", error);
    return NextResponse.json(
      { error: "Failed to fetch midterm evaluations" },
      { status: 500 }
    );
  }
}
