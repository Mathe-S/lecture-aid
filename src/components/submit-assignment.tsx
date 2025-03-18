"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  useGitHubRepositories,
  useSubmitAssignment,
  useUserSubmission,
} from "@/hooks/useSubmissions";
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
  assignmentTitle: string;
}

export function SubmitAssignment({
  assignmentId,
  assignmentTitle,
}: SubmitAssignmentProps) {
  const { user } = useAuth();
  const userId = user?.id;

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
    !repositories?.some(
      (repo) => repo.html_url === existingSubmission?.repositoryUrl
    )
  );

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
      let repoName = "";
      if (!isManualEntry && repositories) {
        const repo = repositories.find((r) => r.html_url === repoUrl);
        repoName = repo?.name || "";
      }

      await submitMutation.mutateAsync({
        assignmentId,
        userId,
        repositoryUrl: repoUrl,
        repositoryName: repoName,
      });

      toast.success("Assignment submitted successfully");
    } catch (error) {
      toast.error("Failed to submit assignment");
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
        <CardTitle>Submit: {assignmentTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
            disabled={!user?.app_metadata?.provider_token}
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
