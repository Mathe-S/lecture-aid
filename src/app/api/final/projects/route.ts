import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { z } from "zod";
import { getUserRole } from "@/lib/userService";
import * as finalProjectService from "@/lib/final-project-service";

// Zod schema for validating new final project data
const NewFinalProjectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  learningObjectives: z.array(z.string()).optional().default([]),
  expectedDeliverables: z.array(z.string()).optional().default([]),
  resourceLinks: z
    .array(z.object({ label: z.string(), url: z.string().url() }))
    .optional()
    .default([]),
  projectTags: z.array(z.string()).optional().default([]),
});

// --- GET all Final Projects ---
export async function GET() {
  try {
    const allProjects = await finalProjectService.getAllFinalProjects();
    return NextResponse.json(allProjects);
  } catch (error) {
    console.error("[API_FINAL_PROJECTS_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// --- POST (Create) a new Final Project (Admin Only) ---
export async function POST(request: Request) {
  const supabase = await supabaseForServer();
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const user = session.user;

  // Check user role
  const role = await getUserRole(user.id);

  if (role !== "admin") {
    return new NextResponse("Forbidden: Admins only", { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = NewFinalProjectSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(JSON.stringify(validation.error.flatten()), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const newProject = await finalProjectService.createFinalProject(
      validation.data,
      user.id
    );

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("[API_FINAL_PROJECTS_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
