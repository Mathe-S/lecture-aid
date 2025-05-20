"use client";

import { useState } from "react";
import { useFinalProjects } from "@/hooks/useFinalProjects";
import { ProjectCard } from "./project-card";
import { ProjectDetailsDialog } from "./project-details-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ServerCrash } from "lucide-react";
import type { FinalProjectWithAdmin } from "@/lib/final-project-service";

export function AvailableProjectsList() {
  const { data: projects, isLoading, isError, error } = useFinalProjects();
  const [selectedProject, setSelectedProject] =
    useState<FinalProjectWithAdmin | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const handleViewDetails = (project: FinalProjectWithAdmin) => {
    setSelectedProject(project);
    setIsDetailsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-2 text-muted-foreground">
          Loading available projects...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="my-4">
        <ServerCrash className="h-4 w-4" />
        <AlertTitle>Error Fetching Projects</AlertTitle>
        <AlertDescription>
          There was a problem loading the available projects. Please try again
          later.
          {error && <p className="text-xs mt-1">Details: {error.message}</p>}
        </AlertDescription>
      </Alert>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">
          No final projects are available at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="py-6">
      <h2 className="text-2xl font-semibold mb-6">Available Final Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>
      <ProjectDetailsDialog
        project={selectedProject}
        isOpen={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      />
    </div>
  );
}
