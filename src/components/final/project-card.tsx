import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FinalProjectWithAdmin } from "@/lib/final-project-service";

interface ProjectCardProps {
  project: FinalProjectWithAdmin;
  onViewDetails: (project: FinalProjectWithAdmin) => void;
  // onSelectProject: (projectId: string) => void; // To be added later
}

const MAX_DESCRIPTION_LENGTH = 150; // Characters

function truncateDescription(description: string | null | undefined): string {
  if (!description) {
    return "No description available."; // Or simply return ""
  }
  if (description.length <= MAX_DESCRIPTION_LENGTH) {
    return description;
  }
  return description.substring(0, MAX_DESCRIPTION_LENGTH) + "...";
}

export function ProjectCard({ project, onViewDetails }: ProjectCardProps) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-lg">
          {project.title || "Untitled Project"}
        </CardTitle>
        {project.category && (
          <Badge variant="outline" className="w-fit mt-1">
            {project.category}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <CardDescription className="text-sm">
          {truncateDescription(project.description)}
        </CardDescription>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onViewDetails(project)}
        >
          View Details
        </Button>
        {/* Placeholder for Select Project Button - to be implemented later
        <Button
          className="w-full mt-2"
          onClick={() => onSelectProject(project.id)}
        >
          Select this Project
        </Button>
        */}
      </CardFooter>
    </Card>
  );
}
