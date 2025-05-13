"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, PlusCircle } from "lucide-react";
import {
  FinalProject,
  NewFinalProject,
  ResourceLink,
} from "@/db/drizzle/final-schema";
import { toast } from "sonner";

export type ProjectFormData = Omit<
  NewFinalProject,
  "createdByAdminId" | "id" | "createdAt" | "updatedAt"
>;

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  projectData?: FinalProject | null;
  isSubmitting?: boolean;
}

const initialFormState: ProjectFormData = {
  title: "",
  description: "",
  category: "",
  learningObjectives: [],
  expectedDeliverables: [],
  resourceLinks: [],
  projectTags: [],
};

export function ProjectForm({
  isOpen,
  onClose,
  onSubmit,
  projectData,
  isSubmitting,
}: ProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>(initialFormState);
  const [currentLearningObjective, setCurrentLearningObjective] = useState("");
  const [currentExpectedDeliverable, setCurrentExpectedDeliverable] =
    useState("");
  const [currentResourceLabel, setCurrentResourceLabel] = useState("");
  const [currentResourceUrl, setCurrentResourceUrl] = useState("");
  const [currentProjectTag, setCurrentProjectTag] = useState("");

  useEffect(() => {
    if (projectData) {
      setFormData({
        title: projectData.title,
        description: projectData.description || "",
        category: projectData.category || "",
        learningObjectives: projectData.learningObjectives || [],
        expectedDeliverables: projectData.expectedDeliverables || [],
        resourceLinks: projectData.resourceLinks || [],
        projectTags: projectData.projectTags || [],
      });
    } else {
      setFormData(initialFormState);
    }
  }, [projectData, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- Array Field Handlers ---

  const addToArrayField = (
    field: keyof ProjectFormData,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (value.trim() === "") return;
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] as string[]), value.trim()],
    }));
    setter("");
  };

  const removeFromArrayField = (
    field: keyof ProjectFormData,
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index),
    }));
  };

  const addResourceLink = () => {
    if (
      currentResourceLabel.trim() === "" ||
      currentResourceUrl.trim() === ""
    ) {
      toast.error("Resource label and URL cannot be empty.");
      return;
    }
    // Basic URL validation
    try {
      new URL(currentResourceUrl);
    } catch (_) {
      toast.error("Invalid URL format for resource link.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      resourceLinks: [
        ...(prev.resourceLinks || []),
        {
          label: currentResourceLabel.trim(),
          url: currentResourceUrl.trim(),
        },
      ],
    }));
    setCurrentResourceLabel("");
    setCurrentResourceUrl("");
  };

  const removeResourceLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      resourceLinks: (prev.resourceLinks || []).filter((_, i) => i !== index),
    }));
  };

  // --- Submit Handler ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Project title cannot be empty.");
      return;
    }
    await onSubmit(formData);
    if (!isSubmitting && !projectData) {
      // Reset form only on successful create
      setFormData(initialFormState);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {projectData ? "Edit Project" : "Create New Project"}
          </DialogTitle>
          <DialogDescription>
            {projectData
              ? "Update the details of the project."
              : "Fill in the details for the new project."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-4 max-h-[70vh] overflow-y-auto">
            <div>
              <Label htmlFor="title">Project Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., AI-Powered Learning Assistant"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                placeholder="Detailed description of the project..."
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                value={formData.category as string}
                onChange={handleChange}
                placeholder="e.g., Data-Driven, Education, Web Development"
              />
            </div>

            {/* Learning Objectives */}
            <div className="space-y-2">
              <Label>Learning Objectives</Label>
              <div className="flex space-x-2">
                <Input
                  value={currentLearningObjective}
                  onChange={(e) => setCurrentLearningObjective(e.target.value)}
                  placeholder="Add a learning objective"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addToArrayField(
                        "learningObjectives",
                        currentLearningObjective,
                        setCurrentLearningObjective
                      );
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    addToArrayField(
                      "learningObjectives",
                      currentLearningObjective,
                      setCurrentLearningObjective
                    )
                  }
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-2">
                {formData.learningObjectives?.map((obj, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <span>{obj}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        removeFromArrayField("learningObjectives", index)
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Expected Deliverables */}
            <div className="space-y-2">
              <Label>Expected Deliverables</Label>
              <div className="flex space-x-2">
                <Input
                  value={currentExpectedDeliverable}
                  onChange={(e) =>
                    setCurrentExpectedDeliverable(e.target.value)
                  }
                  placeholder="Add an expected deliverable"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addToArrayField(
                        "expectedDeliverables",
                        currentExpectedDeliverable,
                        setCurrentExpectedDeliverable
                      );
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    addToArrayField(
                      "expectedDeliverables",
                      currentExpectedDeliverable,
                      setCurrentExpectedDeliverable
                    )
                  }
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-2">
                {formData.expectedDeliverables?.map((del, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <span>{del}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        removeFromArrayField("expectedDeliverables", index)
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resource Links */}
            <div className="space-y-2">
              <Label>Resource Links</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-end">
                <Input
                  value={currentResourceLabel}
                  onChange={(e) => setCurrentResourceLabel(e.target.value)}
                  placeholder="Label (e.g., Documentation)"
                />
                <div className="flex space-x-2">
                  <Input
                    value={currentResourceUrl}
                    onChange={(e) => setCurrentResourceUrl(e.target.value)}
                    placeholder="URL (e.g., https://example.com)"
                    type="url"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addResourceLink}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <ul className="space-y-1 pt-2">
                {formData.resourceLinks?.map((link, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center text-sm p-1 bg-muted/30 rounded"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate"
                    >
                      {link.label}: {link.url}
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeResourceLink(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Project Tags */}
            <div className="space-y-2">
              <Label>Project Tags</Label>
              <div className="flex space-x-2">
                <Input
                  value={currentProjectTag}
                  onChange={(e) => setCurrentProjectTag(e.target.value)}
                  placeholder="Add a tag (e.g., React, AI)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addToArrayField(
                        "projectTags",
                        currentProjectTag,
                        setCurrentProjectTag
                      );
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    addToArrayField(
                      "projectTags",
                      currentProjectTag,
                      setCurrentProjectTag
                    )
                  }
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {formData.projectTags?.map((tag, index) => (
                  <span
                    key={index}
                    className="flex items-center bg-gray-200 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full"
                  >
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-4 w-4 p-0"
                      onClick={() => removeFromArrayField("projectTags", index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? projectData
                  ? "Saving..."
                  : "Creating..."
                : projectData
                ? "Save Changes"
                : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
