import { NextRequest, NextResponse } from "next/server";
import { updateUserProfile } from "@/lib/userService";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    await updateUserProfile(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
