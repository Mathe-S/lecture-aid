import { NextRequest, NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const error = requestUrl.searchParams.get("error");
    const error_description = requestUrl.searchParams.get("error_description");

    // Check for OAuth errors
    if (error) {
      console.error("OAuth error:", error, error_description);
      return NextResponse.redirect(
        `${requestUrl.origin}/?error=${encodeURIComponent(
          error
        )}&error_description=${encodeURIComponent(error_description || "")}`
      );
    }

    // No code, redirect to home
    if (!code) {
      return NextResponse.redirect(requestUrl.origin);
    }

    // Exchange the code for a session
    const supabase = await supabaseForServer();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      code
    );

    if (exchangeError) {
      console.error("Error exchanging code for session:", exchangeError);
      return NextResponse.redirect(
        `${requestUrl.origin}/?error=auth_callback_failed`
      );
    }

    // Successful login, redirect to dashboard
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
  } catch (error) {
    console.error("Unexpected error in auth callback:", error);
    return NextResponse.redirect("/");
  }
}
