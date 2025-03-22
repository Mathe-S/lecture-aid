import {
  createAssignment,
  getAssignments,
  deleteAssignment,
  updateAssignment,
} from "@/lib/assignmentService";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const assignments = await getAssignments();
    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const assignmentData = await request.json();
    const userId = assignmentData.created_by;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const assignment = await createAssignment({
      ...assignmentData,
      created_by: userId,
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const assignmentData = await request.json();
    const assignment = await updateAssignment(
      assignmentData.id,
      assignmentData
    );

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error updating assignment:", error);
    return NextResponse.json(
      { error: "Failed to update assignment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    await deleteAssignment(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment" },
      { status: 500 }
    );
  }
}
