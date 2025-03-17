import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseForServer } from "@/utils/supabase/server";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const supabase = await supabaseForServer();

    // Server-side sign out
    await supabase.auth.signOut();

    // Clear auth cookies
    cookieStore.getAll().forEach((cookie) => {
      if (cookie.name.includes("supabase") || cookie.name.includes("auth")) {
        cookieStore.delete(cookie.name);
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sign out error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to sign out" },
      { status: 500 }
    );
  }
}
