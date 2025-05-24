"use client";

import { useState } from "react";
import {
  useFinalProjectIdea,
  useUpdateFinalProjectIdea,
} from "@/hooks/useFinalProjectIdea";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Edit3,
  Eye,
  Save,
  X,
  FileText,
  Loader2,
  Lightbulb,
} from "lucide-react";

interface ProjectIdeaEditorProps {
  groupId: string;
  isOwner: boolean;
}

const PROJECT_IDEA_TEMPLATE = `# Project Idea: [Your Project Title]

## 📋 Overview
Write a brief overview of your project idea here. What problem does it solve? Who is your target audience?

## 🎯 Objectives
- List your main project objectives
- What do you want to achieve?
- What success looks like

## 🔧 Technical Approach
- What technologies will you use?
- What is your planned architecture?
- Any specific tools or frameworks?

## 📦 Expected Deliverables
- [ ] Feature 1
- [ ] Feature 2  
- [ ] Feature 3
- [ ] Documentation
- [ ] Testing

## 🗓️ Timeline
- **Week 1-2**: Setup and initial development
- **Week 3-4**: Core features implementation
- **Week 5-6**: Testing and polish
- **Week 7**: Final presentation preparation

## 💭 Additional Notes
Any other thoughts, considerations, or ideas for your project...`;

export function ProjectIdeaEditor({
  groupId,
  isOwner,
}: ProjectIdeaEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [activeTab, setActiveTab] = useState("preview");

  const {
    data: projectIdeaData,
    isLoading,
    error,
  } = useFinalProjectIdea(groupId);
  const { mutate: updateProjectIdea, isPending: isUpdating } =
    useUpdateFinalProjectIdea();

  const projectIdea = projectIdeaData?.projectIdea;
  const hasContent = projectIdea && projectIdea.trim().length > 0;

  const handleEdit = () => {
    setEditValue(projectIdea || PROJECT_IDEA_TEMPLATE);
    setIsEditing(true);
    setActiveTab("edit");
  };

  const handleSave = () => {
    updateProjectIdea(
      { groupId, projectIdea: editValue },
      {
        onSuccess: () => {
          setIsEditing(false);
          setActiveTab("preview");
        },
      }
    );
  };

  const handleCancel = () => {
    setEditValue("");
    setIsEditing(false);
    setActiveTab("preview");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-red-500">Failed to load project idea</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <CardTitle>Project Idea</CardTitle>
          </div>
          {isOwner && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="gap-2"
            >
              <Edit3 className="h-4 w-4" />
              {hasContent ? "Edit" : "Add Idea"}
            </Button>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isUpdating}
                className="gap-2"
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isUpdating}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>
        <CardDescription>
          {hasContent
            ? "Your project concept and implementation plan"
            : "Document your project idea, objectives, and implementation plan"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasContent && !isEditing ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No project idea yet</p>
            <p className="text-sm mb-4">
              {isOwner
                ? "Click 'Add Idea' to document your project concept"
                : "The group owner hasn't added a project idea yet"}
            </p>
            {isOwner && (
              <Button onClick={handleEdit} className="gap-2">
                <Lightbulb className="h-4 w-4" />
                Add Project Idea
              </Button>
            )}
          </div>
        ) : isEditing ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit" className="gap-2">
                <Edit3 className="h-4 w-4" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>
            <TabsContent value="edit" className="mt-4">
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Write your project idea in Markdown..."
                className="min-h-[500px] resize-none font-mono text-sm"
                disabled={isUpdating}
              />
              <p className="text-xs text-muted-foreground mt-2">
                You can use Markdown formatting (headings, lists, links, etc.)
              </p>
            </TabsContent>
            <TabsContent value="preview" className="mt-4">
              <div className="border rounded-md p-4 min-h-[500px] bg-slate-50">
                {editValue ? (
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                      {editValue}
                    </pre>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">
                    Nothing to preview yet...
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed bg-slate-50 p-4 rounded-md border">
              {projectIdea}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
