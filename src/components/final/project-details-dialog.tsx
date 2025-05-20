"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LinkIcon, ListChecks, Target } from "lucide-react";
import type { FinalProjectWithAdmin } from "@/lib/final-project-service";

interface ProjectDetailsDialogProps {
  project: FinalProjectWithAdmin | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ProjectDetailsDialog({
  project,
  isOpen,
  onOpenChange,
}: ProjectDetailsDialogProps) {
  if (!project) {
    return null;
  }

  // Provide fallbacks for potentially null or undefined fields, assuming camelCase from service
  const title = project.title || "Project Details";
  const description = project.description || "No description provided.";
  const category = project.category;
  // Assuming FinalProjectWithAdmin has these fields in camelCase if transformed by the service
  const learningObjectives = project.learningObjectives || [];
  const expectedDeliverables = project.expectedDeliverables || [];
  const resourceLinks = project.resourceLinks || [];
  const projectTags = project.projectTags || [];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          {category && (
            <Badge variant="secondary" className="w-fit mt-1">
              {category}
            </Badge>
          )}
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-1 pr-6">
          <div className="space-y-6 py-4 text-sm">
            <div>
              <h3 className="font-semibold text-base mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {description}
              </p>
            </div>

            {learningObjectives.length > 0 && (
              <div>
                <h3 className="font-semibold text-base mb-2 flex items-center">
                  <Target className="w-4 h-4 mr-2 text-blue-500" />
                  Learning Objectives
                </h3>
                <ul className="list-disc list-inside pl-4 space-y-1 text-muted-foreground">
                  {learningObjectives.map(
                    (objective: string, index: number) => (
                      <li key={index}>{objective}</li>
                    )
                  )}
                </ul>
              </div>
            )}

            {expectedDeliverables.length > 0 && (
              <div>
                <h3 className="font-semibold text-base mb-2 flex items-center">
                  <ListChecks className="w-4 h-4 mr-2 text-green-500" />
                  Expected Deliverables
                </h3>
                <ul className="list-disc list-inside pl-4 space-y-1 text-muted-foreground">
                  {expectedDeliverables.map(
                    (deliverable: string, index: number) => (
                      <li key={index}>{deliverable}</li>
                    )
                  )}
                </ul>
              </div>
            )}

            {resourceLinks.length > 0 && (
              <div>
                <h3 className="font-semibold text-base mb-2 flex items-center">
                  <LinkIcon className="w-4 h-4 mr-2 text-purple-500" />
                  Resource Links
                </h3>
                <ul className="space-y-1">
                  {resourceLinks.map((link, index: number) => (
                    <li key={index}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline hover:text-blue-700 transition-colors"
                      >
                        {link.label || link.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {projectTags.length > 0 && (
              <div>
                <h3 className="font-semibold text-base mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {projectTags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
