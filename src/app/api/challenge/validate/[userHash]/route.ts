import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userHash: string }> }
) {
  try {
    const { userHash } = await params;
    const authHeader = request.headers.get("authorization");
    const expectedAuth = `Bearer auth_${userHash}_token`;

    // Check if the correct authorization header is provided
    if (!authHeader || authHeader !== expectedAuth) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Invalid or missing authorization token",
          hint: "Make sure you're using the correct Bearer token format",
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate the request
    if (body.action !== "validate") {
      return NextResponse.json(
        {
          error: "Invalid action",
          message: "Expected action: 'validate'",
        },
        { status: 400 }
      );
    }

    // Return success response with user-specific data
    return NextResponse.json({
      success: true,
      message: "API challenge complete",
      user_hash: userHash,
      timestamp: new Date().toISOString(),
      data: {
        challenge_step: 4,
        validation_status: "passed",
        next_step: "Proceed to Step 5 for the final encryption challenge",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Invalid request",
        message: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}
