"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  useGitHubRepositories,
  useSubmitAssignment,
  useUserSubmission,
} from "@/hooks/useSubmissions";
import { useAssignment } from "@/hooks/useAssignments";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Github, ExternalLink, Check } from "lucide-react";
import { toast } from "sonner";

interface SubmitAssignmentProps {
  assignmentId: string;
}

export function SubmitAssignment({ assignmentId }: SubmitAssignmentProps) {
  const { user, session } = useAuth();
  const userId = user?.id;

  const {
    data: assignment,
    isLoading: isLoadingAssignment,
    error: assignmentError,
  } = useAssignment(assignmentId);

  const { data: repositories, isLoading: isLoadingRepos } =
    useGitHubRepositories();
  const { data: existingSubmission } = useUserSubmission(assignmentId, userId);
  const submitMutation = useSubmitAssignment();

  const [selectedRepo, setSelectedRepo] = useState<string>(
    existingSubmission?.repositoryUrl || ""
  );
  const [manualUrl, setManualUrl] = useState<string>(
    existingSubmission?.repositoryUrl || ""
  );
  const [isManualEntry, setIsManualEntry] = useState<boolean>(
    !!existingSubmission?.repositoryUrl
  );

  // State for custom field inputs: Record<customFieldId, value>
  const [customFieldInputs, setCustomFieldInputs] = useState<
    Record<string, string>
  >({});

  // Effect to initialize customFieldInputs when assignment loads or existing submission changes
  useEffect(() => {
    if (assignment && assignment.customFields) {
      const initialInputs: Record<string, string> = {};
      assignment.customFields.forEach((field) => {
        // Check if there's an existing answer for this field
        const existingAnswer = existingSubmission?.customAnswers?.find(
          (ans) => ans.custom_field_id === field.id
        );
        initialInputs[field.id] = existingAnswer?.value || ""; // Pre-fill or default to empty
      });
      setCustomFieldInputs(initialInputs);
    }
    // Add existingSubmission to dependency array to re-run if it changes
  }, [assignment, existingSubmission]);

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setCustomFieldInputs((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async () => {
    if (!userId) {
      toast.error("You must be logged in to submit");
      return;
    }

    const repoUrl = isManualEntry ? manualUrl : selectedRepo;

    if (!repoUrl) {
      toast.error("Please select or enter a repository URL");
      return;
    }

    try {
      // Find repository name if using dropdown selection
      let repoName = repoUrl.split("/").pop() || "";
      if (!isManualEntry && repositories) {
        const repo = repositories.find((r) => r.html_url === repoUrl);
        repoName = repo?.name || "";
      }

      // Prepare custom answers for submission
      const customAnswersToSubmit = assignment?.customFields
        ? assignment.customFields
            .map((field) => ({
              customFieldId: field.id,
              value: customFieldInputs[field.id] || "",
            }))
            .filter((answer) => answer.value.trim() !== "") // Only submit non-empty answers
        : [];

      await submitMutation.mutateAsync({
        assignmentId,
        userId,
        repositoryUrl: repoUrl,
        repositoryName: repoName,
        customAnswers: customAnswersToSubmit, // Add custom answers to payload
      });

      // Check if this is a new submission or an update
      const actionText = existingSubmission ? "updated" : "submitted";
      toast.success(`Assignment ${actionText} successfully`);
    } catch (error: any) {
      // Properly type the error for TypeScript
      // Check if the error is a duplicate submission that was handled on the server
      const errorMessage =
        error?.response?.data?.error ||
        (typeof error === "object" && error?.message) ||
        "Failed to submit assignment";

      if (errorMessage.includes("already submitted")) {
        toast.success("Your submission has been updated");
        return;
      }

      if (errorMessage.includes("closed and no longer accepting")) {
        toast.error(
          "This assignment is closed and no longer accepting submissions"
        );
        return;
      }

      toast.error(errorMessage);
      console.error(error);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Submit Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please sign in to submit your assignment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Submit: {assignment ? assignment.title : "Loading assignment..."}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingAssignment && (
          <div className="flex items-center space-x-2 text-sm py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading assignment details...</span>
          </div>
        )}
        {assignmentError && (
          <p className="text-sm text-red-500 py-2">
            Error loading assignment details. Please try again later.
          </p>
        )}

        {/* Display Custom Fields as Inputs */}
        {assignment &&
          assignment.customFields &&
          assignment.customFields.length > 0 && (
            <div className="mb-6 p-4 border rounded-md bg-slate-50 space-y-3">
              <h4 className="text-md font-semibold text-slate-800 mb-2">
                Assignment Specifics:
              </h4>
              {assignment.customFields.map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <Label
                    htmlFor={`custom-field-${field.id}`}
                    className="text-sm font-medium text-slate-700"
                  >
                    {field.label}{" "}
                    {field.is_required && (
                      <span className="text-red-500">*</span>
                    )}
                  </Label>
                  <Input
                    id={`custom-field-${field.id}`}
                    value={customFieldInputs[field.id] || ""}
                    onChange={(e) =>
                      handleCustomFieldChange(field.id, e.target.value)
                    }
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    // TODO: Add required attribute based on field.is_required for client-side indication
                  />
                  {/* TODO: Add FormMessage for custom field validation errors if we implement that */}
                </div>
              ))}
            </div>
          )}

        {existingSubmission && (
          <div className="bg-slate-50 p-4 rounded-md mb-4 border border-slate-200">
            <div className="flex items-center text-sm text-green-600 mb-2">
              <Check className="h-4 w-4 mr-1" />
              <span className="font-medium">Current Submission</span>
            </div>
            <a
              href={existingSubmission.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-2 text-sm"
            >
              <Github className="h-4 w-4" />
              {existingSubmission.repositoryName ||
                existingSubmission.repositoryUrl}
              <ExternalLink className="h-3 w-3" />
            </a>

            {existingSubmission.grade !== null && (
              <div className="mt-2 text-sm">
                <span className="font-medium">Grade:</span>{" "}
                {existingSubmission.grade}
              </div>
            )}

            {existingSubmission.feedback && (
              <div className="mt-2 text-sm">
                <div className="font-medium">Feedback:</div>
                <p className="whitespace-pre-line text-slate-700">
                  {existingSubmission.feedback}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Button
            variant={isManualEntry ? "outline" : "default"}
            size="sm"
            onClick={() => setIsManualEntry(false)}
            disabled={!session?.provider_token}
          >
            <Github className="h-4 w-4 mr-2" />
            Select from GitHub
          </Button>
          <Button
            variant={isManualEntry ? "default" : "outline"}
            size="sm"
            onClick={() => setIsManualEntry(true)}
          >
            Enter URL manually
          </Button>
        </div>

        {isManualEntry ? (
          <div className="space-y-2">
            <Label htmlFor="manual-url">Repository URL</Label>
            <Input
              id="manual-url"
              placeholder="https://github.com/username/repository"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="repo-select">Select Repository</Label>
            {isLoadingRepos ? (
              <div className="flex items-center space-x-2 text-sm py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading repositories...</span>
              </div>
            ) : repositories?.length ? (
              <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a repository" />
                </SelectTrigger>
                <SelectContent>
                  {repositories.map((repo) => (
                    <SelectItem key={repo.id} value={repo.html_url}>
                      {repo.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-slate-500 py-2">
                No public repositories found. Please connect your GitHub account
                or enter a URL manually.
              </p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSubmit}
          disabled={submitMutation.isPending || (!selectedRepo && !manualUrl)}
        >
          {submitMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : existingSubmission ? (
            "Update Submission"
          ) : (
            "Submit Assignment"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
