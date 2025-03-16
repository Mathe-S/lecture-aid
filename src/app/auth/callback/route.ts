import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=auth_callback_failed`
      );
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
}
