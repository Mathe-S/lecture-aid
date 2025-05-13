import db from "@/db";
import {
  finalProjects,
  NewFinalProject,
  FinalProject,
} from "@/db/drizzle/final-schema";
import { profiles } from "@/db/drizzle/schema";
import { eq, desc } from "drizzle-orm";

export interface FinalProjectWithAdmin extends FinalProject {
  adminCreator?: {
    fullName: string | null;
    avatarUrl: string | null;
    email: string | null;
  } | null;
}

/**
 * Get all final projects with admin creator profile details (full name, avatar).
 */
export async function getAllFinalProjects(): Promise<FinalProjectWithAdmin[]> {
  const projects = await db.query.finalProjects.findMany({
    with: {
      adminCreator: {
        columns: {
          fullName: true,
          avatarUrl: true,
          email: true,
        },
      },
    },
    orderBy: [desc(finalProjects.createdAt)],
  });
  return projects as FinalProjectWithAdmin[];
}

/**
 * Create a new final project.
 * @param data - The data for the new project (Validated by Zod in API route).
 * @param adminId - The ID of the admin creating the project.
 * @returns The newly created final project.
 */
export async function createFinalProject(
  data: Omit<NewFinalProject, "createdByAdminId">,
  adminId: string
): Promise<FinalProject> {
  const [newProject] = await db
    .insert(finalProjects)
    .values({
      ...data,
      createdByAdminId: adminId,
    })
    .returning();
  return newProject;
}

/**
 * Get a single final project by its ID with admin creator profile details.
 */
export async function getFinalProjectById(
  projectId: string
): Promise<FinalProjectWithAdmin | null> {
  const [project] = await db.query.finalProjects.findMany({
    where: eq(finalProjects.id, projectId),
    with: {
      adminCreator: {
        columns: {
          fullName: true,
          avatarUrl: true,
          email: true,
        },
      },
    },
    limit: 1,
  });
  return (project as FinalProjectWithAdmin) || null;
}

/**
 * Update an existing final project.
 * @param projectId - The ID of the project to update.
 * @param data - The data to update for the project.
 * @returns The updated final project or null if not found.
 */
export async function updateFinalProject(
  projectId: string,
  data: Partial<Omit<NewFinalProject, "createdByAdminId">>
): Promise<FinalProject | null> {
  const [updatedProject] = await db
    .update(finalProjects)
    .set({
      ...data,
      updatedAt: new Date().toISOString(), // Ensure updatedAt is an ISO string
    })
    .where(eq(finalProjects.id, projectId))
    .returning();
  return updatedProject || null;
}

/**
 * Delete a final project by its ID.
 * @param projectId - The ID of the project to delete.
 * @returns True if deletion was successful, false otherwise.
 */
export async function deleteFinalProject(projectId: string): Promise<boolean> {
  const result = await db
    .delete(finalProjects)
    .where(eq(finalProjects.id, projectId))
    .returning({ id: finalProjects.id });
  return result.length > 0;
}
