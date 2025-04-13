import { NextResponse } from "next/server";
import { getLeaderboardData } from "@/lib/gradesService"; // We will create this function next

export async function GET() {
  try {
    // This endpoint is public, so no authentication/authorization check needed here.
    // The service function will handle selecting only necessary, non-sensitive data.
    const leaderboardData = await getLeaderboardData();

    return NextResponse.json(leaderboardData);
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard data" },
      { status: 500 }
    );
  }
}
