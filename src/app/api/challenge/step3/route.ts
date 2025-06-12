import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const devToolsClue = request.headers.get("X-DevTools-Clue");

    // This endpoint is just for DevTools discovery - students will find this in Network tab
    return NextResponse.json({
      message: "DevTools discovery endpoint",
      clue: devToolsClue,
      userHash: body.userHash,
      hint: "You found the network request! Look for the X-DevTools-Clue header.",
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
