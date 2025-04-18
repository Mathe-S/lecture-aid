import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import {
  isGroupOwner,
  replaceGroupTasks,
  parseTodoMarkdown,
} from "@/lib/midterm-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await supabaseForServer();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: groupId } = await params;
  const userId = userData.user.id;

  try {
    // Check if the user is the owner of the group
    const ownerCheck = await isGroupOwner(groupId, userId);
    if (!ownerCheck) {
      return NextResponse.json(
        { error: "Forbidden: Only group owner can upload TODO list" },
        { status: 403 }
      );
    }

    // Read the markdown content from the request body
    const markdownContent = await request.text();
    if (!markdownContent) {
      return NextResponse.json(
        { error: "Missing markdown content in request body" },
        { status: 400 }
      );
    }

    // Parse the markdown
    const parsedTasks = parseTodoMarkdown(markdownContent);
    console.log(`[TODO Upload ${groupId}] Parsed ${parsedTasks.length} tasks.`);

    // Replace tasks in the database
    await replaceGroupTasks(groupId, parsedTasks);
    console.log(`[TODO Upload ${groupId}] Replaced tasks in DB.`);

    return NextResponse.json(
      {
        message: "TODO list updated successfully",
        taskCount: parsedTasks.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`[API TODO Upload Error ${groupId}]:`, error);
    return NextResponse.json(
      { error: "Failed to update TODO list", details: error.message },
      { status: 500 }
    );
  }
}
