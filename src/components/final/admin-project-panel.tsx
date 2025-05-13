"use client";

import { useState } from "react";
import {
  useFinalProjects,
  useCreateFinalProject,
  useUpdateFinalProject,
  useDeleteFinalProject,
} from "@/hooks/useFinalProjects";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle, Edit3, Trash2, MoreVertical } from "lucide-react";
import { FinalProject } from "@/db/drizzle/final-schema";
import { ProjectForm, ProjectFormData } from "./project-form";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FinalProjectWithAdmin } from "@/lib/final-project-service";

interface AdminProjectPanelProps {}

export function AdminProjectPanel({}: AdminProjectPanelProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedProjectForEdit, setSelectedProjectForEdit] =
    useState<FinalProjectWithAdmin | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState<FinalProjectWithAdmin | null>(null);

  const {
    data: projects = [],
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useFinalProjects();

  const { mutateAsync: createProject, isPending: isCreatingProject } =
    useCreateFinalProject();
  const { mutateAsync: updateProject, isPending: isUpdatingProject } =
    useUpdateFinalProject();
  const { mutateAsync: deleteProject, isPending: isDeletingProject } =
    useDeleteFinalProject();

  const handleCreateProject = async (data: ProjectFormData) => {
    try {
      await createProject(data);
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Create project failed in panel:", error);
    }
  };

  const handleUpdateProject = async (data: ProjectFormData) => {
    if (!selectedProjectForEdit) return;
    try {
      await updateProject({
        projectId: selectedProjectForEdit.id,
        data,
      });
      setSelectedProjectForEdit(null);
    } catch (error) {
      console.error("Update project failed in panel:", error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Delete project failed in panel:", error);
    }
  };

  const openEditDialog = (project: FinalProjectWithAdmin) => {
    setSelectedProjectForEdit(project);
    setShowCreateDialog(false);
  };

  if (isLoadingProjects) {
    return <p>Loading projects...</p>;
  }

  if (projectsError) {
    return <p>Error loading projects: {projectsError.message}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Manage Projects</h3>
        <Button
          onClick={() => {
            console.log("Create New Project button clicked");
            setSelectedProjectForEdit(null);
            setShowCreateDialog((prev) => {
              console.log(
                "setShowCreateDialog called. New value should be true. Previous:",
                prev
              );
              return true;
            });
          }}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Project
        </Button>
      </div>

      {/* Debug log for dialog rendering condition */}
      {/* We need a way to log this without breaking JSX. 
          A common trick is to use a self-invoking function or render null. 
          Or, for temporary debugging, break it out if complex.
          For simplicity now, we rely on the click handler logs primarily.
      */}
      {(() => {
        console.log(
          "Checking dialog states for rendering. showCreateDialog:",
          showCreateDialog,
          "selectedProjectForEdit:",
          selectedProjectForEdit
        );
        return null; // This console.log will execute during render but renders nothing
      })()}

      {(showCreateDialog || selectedProjectForEdit) && (
        <ProjectForm
          isOpen={showCreateDialog || !!selectedProjectForEdit}
          onClose={() => {
            setShowCreateDialog(false);
            setSelectedProjectForEdit(null);
          }}
          onSubmit={
            selectedProjectForEdit ? handleUpdateProject : handleCreateProject
          }
          projectData={selectedProjectForEdit}
          isSubmitting={isCreatingProject || isUpdatingProject}
        />
      )}

      {projects.length === 0 && !isLoadingProjects && (
        <p className="text-muted-foreground">
          No projects created yet. Click "Create New Project" to add one.
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="leading-tight">{project.title}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto h-8 w-8 p-0"
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open project menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(project)}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowDeleteConfirm(project)}
                      className="text-red-600 hover:!text-red-600 focus:!text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription className="text-sm">
                Category: {project.category}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {project.description}
              </p>
            </CardContent>
            <CardFooter className="mt-auto">
              <p className="text-xs text-muted-foreground">
                Created by:{" "}
                {project.adminCreator?.fullName ||
                  project.adminCreator?.email ||
                  "N/A"}
              </p>
            </CardFooter>
          </Card>
        ))}
      </div>

      {showDeleteConfirm && (
        <AlertDialog
          open={!!showDeleteConfirm}
          onOpenChange={() => setShowDeleteConfirm(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                project "<strong>{showDeleteConfirm.title}</strong>".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteProject(showDeleteConfirm.id)}
                disabled={isDeletingProject}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeletingProject ? "Deleting..." : "Yes, delete project"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
