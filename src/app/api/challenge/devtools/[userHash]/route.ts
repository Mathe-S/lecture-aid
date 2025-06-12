import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userHash: string }> }
) {
  try {
    const { userHash } = await params;
    const securityLevel = request.headers.get("X-Security-Level");

    // Validate the security level header
    if (securityLevel !== "5") {
      return NextResponse.json(
        { error: "Invalid security level" },
        { status: 403 }
      );
    }

    // Generate response data specific to this user
    const responseData = {
      status: "success",
      message: "DevTools network challenge detected",
      userHash: userHash,
      securityLevel: 5,
      networkClue: `network_trace_${userHash}`,
      timestamp: new Date().toISOString(),
      hidden: {
        verification: `network_verified_${userHash}`,
        challenge: "step5_network_complete",
      },
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "X-Challenge-Step": "5",
        "X-Network-Clue": `network_trace_${userHash}`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("DevTools API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userHash: string }> }
) {
  try {
    const { userHash } = await params;
    const body = await request.json();

    return NextResponse.json({
      status: "challenge_complete",
      userHash: userHash,
      message: "Advanced DevTools challenge completed",
      data: body,
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
