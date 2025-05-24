"use client";

import { useState } from "react";
import { useUpdateGroupRepository } from "@/hooks/useFinalUserGroup";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GitBranch,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RepositoryLinkDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  currentRepositoryUrl?: string | null;
}

export function RepositoryLinkDialog({
  isOpen,
  onOpenChange,
  groupId,
  currentRepositoryUrl,
}: RepositoryLinkDialogProps) {
  const [repositoryUrl, setRepositoryUrl] = useState(
    currentRepositoryUrl || ""
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const { mutate: updateRepository, isPending } = useUpdateGroupRepository();

  const validateGitHubUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Empty URL is valid (removes repository)

    // GitHub URL patterns
    const githubPatterns = [
      /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/?$/,
      /^https:\/\/github\.com\/[^\/]+\/[^\/]+\.git$/,
      /^git@github\.com:[^\/]+\/[^\/]+\.git$/,
    ];

    return githubPatterns.some((pattern) => pattern.test(url.trim()));
  };

  const handleUrlChange = (value: string) => {
    setRepositoryUrl(value);
    setValidationError(null);

    if (value.trim() && !validateGitHubUrl(value)) {
      setValidationError("Please enter a valid GitHub repository URL");
    }
  };

  const handleSubmit = () => {
    const trimmedUrl = repositoryUrl.trim();

    if (trimmedUrl && !validateGitHubUrl(trimmedUrl)) {
      setValidationError("Please enter a valid GitHub repository URL");
      return;
    }

    updateRepository(
      { groupId, repositoryUrl: trimmedUrl },
      {
        onSuccess: () => {
          onOpenChange(false);
          setRepositoryUrl("");
          setValidationError(null);
        },
      }
    );
  };

  const handleRemoveRepository = () => {
    updateRepository(
      { groupId, repositoryUrl: "" },
      {
        onSuccess: () => {
          onOpenChange(false);
          setRepositoryUrl("");
          setValidationError(null);
        },
      }
    );
  };

  const handleCancel = () => {
    setRepositoryUrl(currentRepositoryUrl || "");
    setValidationError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            {currentRepositoryUrl ? "Update Repository" : "Link Repository"}
          </DialogTitle>
          <DialogDescription>
            {currentRepositoryUrl
              ? "Update your GitHub repository URL or remove the current repository."
              : "Link your GitHub repository to track your project development."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="repository-url">GitHub Repository URL</Label>
            <Input
              id="repository-url"
              placeholder="https://github.com/username/repository"
              value={repositoryUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              disabled={isPending}
              className={validationError ? "border-red-500" : ""}
            />
            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Help Text */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Supported formats:</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• https://github.com/username/repository</li>
                  <li>• https://github.com/username/repository.git</li>
                  <li>• git@github.com:username/repository.git</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Current Repository Display */}
          {currentRepositoryUrl && (
            <div className="p-3 bg-slate-50 rounded-md border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Current Repository</p>
                  <p className="text-sm text-muted-foreground break-all">
                    {currentRepositoryUrl}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(currentRepositoryUrl, "_blank")}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {currentRepositoryUrl && (
            <Button
              variant="destructive"
              onClick={handleRemoveRepository}
              disabled={isPending}
              className="gap-2"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Remove
            </Button>
          )}
          <Button variant="outline" onClick={handleCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !!validationError}
            className="gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GitBranch className="h-4 w-4" />
            )}
            {currentRepositoryUrl ? "Update" : "Link"} Repository
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
