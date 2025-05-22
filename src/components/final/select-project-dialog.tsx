"use client";

import { useState } from "react";
import { useFinalProjects } from "@/hooks/useFinalProjects"; // Assuming this hook exists and fetches FinalProjectWithAdmin[]
import type { FinalProjectWithAdmin } from "@/lib/final-project-service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Info, CheckCircle } from "lucide-react";

interface SelectProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onProjectSelect: (projectId: string) => void;
  currentSelectedProjectId?: string | null;
  isSelectingProject: boolean; // To disable buttons during mutation
}

function ProjectListItem({
  project,
  onSelect,
  isSelected,
  isCurrentlySelectedByGroup,
  isProcessingSelection,
}: {
  project: FinalProjectWithAdmin;
  onSelect: () => void;
  isSelected: boolean;
  isCurrentlySelectedByGroup: boolean;
  isProcessingSelection: boolean;
}) {
  return (
    <div
      className={`m-1 p-3 mb-2 border rounded-lg hover:bg-slate-50 ${
        isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""
      } ${isCurrentlySelectedByGroup ? "bg-green-50 border-green-300" : ""}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-sm">
            {project.title || "Untitled Project"}
          </h4>
          <p className="text-xs text-muted-foreground">
            Category: {project.category || "N/A"}
          </p>
        </div>
        {isCurrentlySelectedByGroup ? (
          <Button variant="ghost" size="sm" disabled className="text-green-600">
            <CheckCircle className="mr-1.5 h-4 w-4" /> Selected
          </Button>
        ) : (
          <Button
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={onSelect}
            disabled={isProcessingSelection}
          >
            {isSelected ? "✓ Selected" : "Select"}
          </Button>
        )}
      </div>
      {project.description && (
        <p className="text-xs mt-1 text-slate-600 line-clamp-2">
          {project.description}
        </p>
      )}
    </div>
  );
}

export function SelectProjectDialog({
  isOpen,
  onOpenChange,
  onProjectSelect,
  currentSelectedProjectId,
  isSelectingProject,
}: SelectProjectDialogProps) {
  const { data: projects, isLoading, isError, error } = useFinalProjects();
  const [tentativelySelectedProjectId, setTentativelySelectedProjectId] =
    useState<string | null>(null);

  const handleConfirmSelection = () => {
    if (tentativelySelectedProjectId) {
      onProjectSelect(tentativelySelectedProjectId);
      // Dialog close will be handled by parent upon successful mutation or if onOpenChange is called
    }
  };

  const handleDialogClose = () => {
    setTentativelySelectedProjectId(null); // Reset selection on close
    onOpenChange(false);
  };

  let content;
  if (isLoading) {
    content = (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="ml-3 text-muted-foreground">Loading projects...</p>
      </div>
    );
  } else if (isError) {
    content = (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertTitle>Error Loading Projects</AlertTitle>
        <AlertDescription>
          {error?.message || "Could not load projects at this time."} Try again
          later.
        </AlertDescription>
      </Alert>
    );
  } else if (!projects || projects.length === 0) {
    content = (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>No Projects Available</AlertTitle>
        <AlertDescription>
          There are no final projects defined by admins yet.
        </AlertDescription>
      </Alert>
    );
  } else {
    content = (
      <ScrollArea className="h-[400px] pr-3">
        {projects.map((project) => (
          <ProjectListItem
            key={project.id}
            project={project}
            onSelect={() => setTentativelySelectedProjectId(project.id)}
            isSelected={tentativelySelectedProjectId === project.id}
            isCurrentlySelectedByGroup={currentSelectedProjectId === project.id}
            isProcessingSelection={isSelectingProject}
          />
        ))}
      </ScrollArea>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select a Final Project</DialogTitle>
          <DialogDescription>
            Choose one project for your group from the list of available
            projects defined by the admins.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">{content}</div>
        <DialogFooter className="sm:justify-between">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleConfirmSelection}
            disabled={
              !tentativelySelectedProjectId ||
              isSelectingProject ||
              currentSelectedProjectId === tentativelySelectedProjectId
            }
          >
            {isSelectingProject && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Confirm Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
