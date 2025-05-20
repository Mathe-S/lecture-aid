import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { createFinalGroup } from "@/lib/final-group-service";
import { z } from "zod";

const createGroupSchema = z.object({
  name: z
    .string()
    .min(3, "Group name must be at least 3 characters long.")
    .max(100, "Group name must be at most 100 characters long."),
  // Add other fields like description if they can be set at creation
});

export async function POST(request: Request) {
  const supabase = await supabaseForServer();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = userData.user.id;

  try {
    const body = await request.json();
    const validation = createGroupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name } = validation.data;

    // Assuming createFinalGroup now correctly handles ownerId internally
    const newGroup = await createFinalGroup(name, userId);
    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error("[API_FINAL_GROUPS_POST] Error:", error);
    if (error instanceof Error) {
      // Check for specific error messages from the service if needed
      if (error.message.includes("User is already in a final project group")) {
        return NextResponse.json({ error: error.message }, { status: 409 }); // Conflict
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "An unknown error occurred" },
      { status: 500 }
    );
  }
}
