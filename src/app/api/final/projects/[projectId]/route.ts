import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { getUserRole } from "@/lib/userService";
import * as finalProjectService from "@/lib/final-project-service";
import { z } from "zod";

// Zod schema for validating updated final project data
// Note: createdByAdminId is not updatable here. Title and category might be required for an update.
const UpdateFinalProjectSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters long")
      .optional(),
    description: z.string().optional(),
    category: z.string().min(1, "Category is required").optional(),
    learningObjectives: z.array(z.string()).optional(),
    expectedDeliverables: z.array(z.string()).optional(),
    resourceLinks: z
      .array(z.object({ label: z.string(), url: z.string().url() }))
      .optional(),
    projectTags: z.array(z.string()).optional(),
  })
  .partial(); // .partial() makes all fields optional for updates

interface RouteParams {
  params: {
    projectId: string;
  };
}

// --- GET a single Final Project by ID ---
export async function GET(request: Request, { params }: RouteParams) {
  const { projectId } = params;
  if (!projectId) {
    return new NextResponse("Project ID is required", { status: 400 });
  }

  try {
    const project = await finalProjectService.getFinalProjectById(projectId);
    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    console.error("[API_FINAL_PROJECT_ID_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// --- PUT (Update) a Final Project (Admin Only) ---
export async function PUT(request: Request, { params }: RouteParams) {
  const { projectId } = params;
  if (!projectId) {
    return new NextResponse("Project ID is required", { status: 400 });
  }

  const supabase = await supabaseForServer();
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const user = session.user;

  const role = await getUserRole(user.id);
  if (role !== "admin") {
    return new NextResponse("Forbidden: Admins only", { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = UpdateFinalProjectSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(JSON.stringify(validation.error.flatten()), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Ensure there's at least one field to update if the schema is fully partial
    if (Object.keys(validation.data).length === 0) {
      return new NextResponse("No update data provided", { status: 400 });
    }

    const updatedProject = await finalProjectService.updateFinalProject(
      projectId,
      validation.data
    );

    if (!updatedProject) {
      return new NextResponse("Project not found or failed to update", {
        status: 404,
      });
    }
    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("[API_FINAL_PROJECT_ID_PUT]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// --- DELETE a Final Project (Admin Only) ---
export async function DELETE(request: Request, { params }: RouteParams) {
  const { projectId } = params;
  if (!projectId) {
    return new NextResponse("Project ID is required", { status: 400 });
  }

  const supabase = await supabaseForServer();
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const user = session.user;

  const role = await getUserRole(user.id);
  if (role !== "admin") {
    return new NextResponse("Forbidden: Admins only", { status: 403 });
  }

  try {
    const success = await finalProjectService.deleteFinalProject(projectId);
    if (!success) {
      return new NextResponse("Project not found or failed to delete", {
        status: 404,
      });
    }
    return new NextResponse(null, { status: 204 }); // No content, successful deletion
  } catch (error) {
    console.error("[API_FINAL_PROJECT_ID_DELETE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
