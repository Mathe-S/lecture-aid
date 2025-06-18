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

const PROJECT_IDEA_TEMPLATE = `# Project: [Your Project Title]

## 👥 Team Information
- **Team Members**: [Name(s) and roles if group project]
- **Selected Base Project**: [Which of the 10 admin projects you're extending]

## 🎯 Project Vision
**Problem Statement**: [What specific problem does your project solve?]
**Target Users**: [Who will use this application?]
**Value Proposition**: [Why is this solution valuable?]

## 🏗️ Architecture & Technical Design

### Tech Stack
- **Frontend**: React + TypeScript
- **Backend**: Node.js + TypeScript  
- **Database**: [Your choice - PostgreSQL, MongoDB, etc.]
- **Deployment**: AWS [specify services - EC2, ECS, Lambda, etc.]
- **Testing**: [Mocha, Jest, Cypress, etc.]

### System Architecture
- **Component Hierarchy**: [Key React components and their relationships]
- **API Design**: [Main endpoints and data flow]
- **Database Schema**: [Key entities and relationships]
- **Authentication**: [How you'll handle user auth]

### Key Design Decisions
- [Decision 1 and rationale]
- [Decision 2 and rationale]
- [Decision 3 and rationale]

## 🧪 Test-Driven Development Strategy
- **Core Features to Test**: [List main functionalities requiring tests]
- **Testing Approach**: [Unit tests for X, integration tests for Y]
- **Test Coverage Goals**: [What percentage/areas you'll focus on]

## 📦 Feature Breakdown

### Core Features (Must-Have)
- [ ] [Feature 1 - brief description]
- [ ] [Feature 2 - brief description]
- [ ] [Feature 3 - brief description]

### Enhanced Features (Nice-to-Have)
- [ ] [Enhancement 1]
- [ ] [Enhancement 2]

## 📅 4-Week Development Plan

### Week 1: Planning & Setup
- [ ] Project setup (React + Node + TypeScript)
- [ ] Database design and setup
- [ ] Basic project structure
- [ ] Initial test framework setup
- [ ] Environment configuration

### Week 2: Minimal App + Testing
- [ ] Core backend API endpoints
- [ ] Basic frontend components
- [ ] Write and run initial tests
- [ ] Database integration
- [ ] Authentication setup

### Week 3: Deployment + Development
- [ ] AWS deployment setup
- [ ] CI/CD pipeline (if applicable)
- [ ] Core feature development
- [ ] Test implementation for new features
- [ ] Performance optimization

### Week 4: Polish + Final Development
- [ ] Enhanced features implementation
- [ ] UI/UX improvements
- [ ] Comprehensive testing
- [ ] Documentation completion
- [ ] Final deployment and demo prep

## 🚀 Deployment Strategy
- **AWS Services**: [EC2, RDS, S3, etc.]
- **Environment Variables**: [How you'll manage config]
- **Database Hosting**: [AWS RDS, etc.]
- **Domain & SSL**: [If applicable]

## 📚 Documentation Plan
- **README**: Setup and run instructions
- **API Documentation**: Key endpoints and usage
- **Architecture Docs**: System design decisions
- **Testing Docs**: How to run tests and coverage

## 🤔 Potential Challenges & Solutions
- **Challenge 1**: [Technical challenge you anticipate]
  - *Solution approach*: [How you plan to address it]
- **Challenge 2**: [Another potential issue]
  - *Solution approach*: [Your strategy]

## 📈 Success Metrics
- **Functionality**: [How you'll measure if features work]
- **Code Quality**: [Linting, type safety, etc.]
- **Performance**: [Load times, responsiveness]
- **User Experience**: [Usability goals]

---

## 🎯 Grading Criteria (400 points total)
1. **Code Quality & Architecture** (100 pts - 25%)
2. **Testing Strategy & Implementation** (100 pts - 25%)
3. **Functionality & User Experience** (100 pts - 25%)
4. **Documentation & Technical Decisions** (100 pts - 25%)`;

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
