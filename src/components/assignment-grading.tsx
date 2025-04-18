"use client";

import { useState, useRef, useEffect } from "react";
import {
  useCloseAssignment,
  useUploadGradesJson,
  useUploadSingleGradeJson,
  useAdminSubmitAssignment,
} from "@/hooks/useAssignments";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, Lock, User, Send } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Assignment } from "@/db/drizzle/schema";
import { createClient } from "@/utils/supabase/client";

interface AssignmentGradingProps {
  assignment: Assignment;
}

async function getUserIdByEmail(email: string): Promise<string | null> {
  console.log(`Attempting to find user ID for email: ${email}`);
  if (!email) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (error) {
      console.error("Error fetching profile by email:", error);
      if (error.code === "PGRST116") {
        toast.error(
          `Multiple users found with email ${email}. Please contact support.`
        );
        return null;
      }
      return null;
    }
    console.log("Found user profile:", data);
    return data?.id || null;
  } catch (err) {
    console.error("Unexpected error fetching user ID:", err);
    return null;
  }
}

export function AssignmentGrading({ assignment }: AssignmentGradingProps) {
  const [isGradingOpen, setIsGradingOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [gradeStudentId, setGradeStudentId] = useState<string>("");

  const [isLateSubmitOpen, setIsLateSubmitOpen] = useState(false);
  const [lateSubmitEmail, setLateSubmitEmail] = useState<string>("");
  const [lateSubmitRepoUrl, setLateSubmitRepoUrl] = useState<string>("");
  const [lateSubmitRepoName, setLateSubmitRepoName] = useState<string>("");
  const [lateSubmitError, setLateSubmitError] = useState<string | null>(null);
  const [isFindingUser, setIsFindingUser] = useState(false);

  const closeAssignment = useCloseAssignment();
  const uploadGradesJson = useUploadGradesJson();
  const uploadSingleGradeJson = useUploadSingleGradeJson();
  const adminSubmitAssignment = useAdminSubmitAssignment();

  useEffect(() => {
    if (!isGradingOpen) {
      setSelectedFile(null);
      setFileError(null);
      setGradeStudentId("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isGradingOpen]);

  useEffect(() => {
    if (!isLateSubmitOpen) {
      setLateSubmitEmail("");
      setLateSubmitRepoUrl("");
      setLateSubmitRepoName("");
      setLateSubmitError(null);
      setIsFindingUser(false);
    }
  }, [isLateSubmitOpen]);

  const handleCloseAssignment = async () => {
    try {
      await closeAssignment.mutateAsync(assignment.id);
      toast.success("Assignment closed successfully");
    } catch (error) {
      console.error("Error closing assignment:", error);
      toast.error("Failed to close assignment");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = event.target.files?.[0] || null;

    if (!file) {
      return;
    }

    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      setFileError("Please upload a JSON file");
      return;
    }

    setSelectedFile(file);
  };

  const handleGradeUpload = async () => {
    if (!selectedFile) {
      setFileError("Please select a JSON file");
      return;
    }
    setFileError(null);

    try {
      const fileContent = await selectedFile.text();
      let gradesData;

      try {
        gradesData = JSON.parse(fileContent);
      } catch (error) {
        console.error("Error parsing JSON:", error);
        setFileError("Invalid JSON file. Please check the file format.");
        return;
      }

      if (gradeStudentId.trim()) {
        await uploadSingleGradeJson.mutateAsync({
          assignmentId: assignment.id,
          studentId: gradeStudentId.trim(),
          gradesData,
        });
        toast.success(
          `Grade uploaded successfully for ${gradeStudentId.trim()}`
        );
      } else {
        await uploadGradesJson.mutateAsync({
          assignmentId: assignment.id,
          gradesData,
        });
        toast.success("Bulk grades uploaded successfully");
      }

      setIsGradingOpen(false);
    } catch (error: any) {
      console.error("Error uploading grades:", error);
      const errorMessage = error?.message || "Failed to upload grades";
      toast.error(errorMessage);
      setFileError(errorMessage);
    }
  };

  const handleLateSubmit = async () => {
    setLateSubmitError(null);
    if (
      !lateSubmitEmail.trim() ||
      !lateSubmitRepoUrl.trim() ||
      !lateSubmitRepoName.trim()
    ) {
      setLateSubmitError("All fields are required.");
      return;
    }

    setIsFindingUser(true);
    let userId: string | null = null;
    try {
      userId = await getUserIdByEmail(lateSubmitEmail.trim());
      setIsFindingUser(false);

      if (!userId) {
        setLateSubmitError(
          `User not found with email: ${lateSubmitEmail.trim()}`
        );
        toast.error(`User not found: ${lateSubmitEmail.trim()}`);
        return;
      }

      await adminSubmitAssignment.mutateAsync({
        assignmentId: assignment.id,
        userId: userId,
        repositoryUrl: lateSubmitRepoUrl.trim(),
        repositoryName: lateSubmitRepoName.trim(),
      });

      toast.success(`Submission successful for ${lateSubmitEmail.trim()}`);
      setIsLateSubmitOpen(false);
    } catch (error: any) {
      setIsFindingUser(false);
      console.error("Error during late submission:", error);
      const errorMessage = error?.message || "Failed to submit assignment";
      setLateSubmitError(errorMessage);
      toast.error(`Submission failed: ${errorMessage}`);
    }
  };

  const isGradingUploading =
    uploadGradesJson.isPending || uploadSingleGradeJson.isPending;
  const isGradeButtonDisabled = !selectedFile || isGradingUploading;

  const isLateSubmitting = adminSubmitAssignment.isPending || isFindingUser;

  return (
    <div className="flex space-x-2">
      <Button
        variant="outline"
        onClick={handleCloseAssignment}
        disabled={closeAssignment.isPending}
      >
        {closeAssignment.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Lock className="mr-2 h-4 w-4" />
        )}
        Close Assignment
      </Button>

      <Dialog open={isGradingOpen} onOpenChange={setIsGradingOpen}>
        <DialogTrigger asChild>
          <Button variant="default">
            <Upload className="mr-2 h-4 w-4" />
            Grade with JSON
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Grading JSON</DialogTitle>
            <DialogDescription>
              Upload a JSON file containing student grades. Leave the
              &quot;Student Email&quot; field empty to apply grades in bulk, or
              enter a specific email to grade only that student.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="grade-student-id">Student Email (Optional)</Label>
              <Input
                id="grade-student-id"
                type="email"
                placeholder="student@example.com"
                value={gradeStudentId}
                onChange={(e) => setGradeStudentId(e.target.value)}
                disabled={isGradingUploading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade-file">Grading JSON File</Label>
              <Input
                id="grade-file"
                type="file"
                accept=".json,application/json"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={isGradingUploading}
              />
              {fileError && <p className="text-sm text-red-500">{fileError}</p>}
              {selectedFile && (
                <p className="text-sm text-green-500">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
            <div className="text-sm">
              <p className="font-medium">Expected JSON format:</p>
              <pre className="mt-2 rounded bg-slate-100 p-2 text-xs overflow-auto max-h-40">
                {`{
  "timestamp": "2023-01-01T00:00:00Z",
  "students": [
    {
      "studentId": "student@email.com",
      "points": 85,
      "similarityInfo": { ... },
      "notes": [ ... ],
      // Other student data
    },
    // More students
  ]
}`}
              </pre>
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <DialogClose asChild>
              <Button variant="outline" disabled={isGradingUploading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleGradeUpload}
              disabled={isGradeButtonDisabled}
            >
              {isGradingUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : gradeStudentId.trim() ? (
                <User className="mr-2 h-4 w-4" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {isGradingUploading
                ? "Uploading..."
                : gradeStudentId.trim()
                ? "Grade Single Student"
                : "Upload Bulk Grades"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLateSubmitOpen} onOpenChange={setIsLateSubmitOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Send className="mr-2 h-4 w-4" />
            Late Submission
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Assignment for Student</DialogTitle>
            <DialogDescription>
              Enter the student&apos;s email and their submission details. This
              will create or update their submission, bypassing closure status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="late-submit-email">Student Email</Label>
              <Input
                id="late-submit-email"
                type="email"
                placeholder="student@example.com"
                value={lateSubmitEmail}
                onChange={(e) => setLateSubmitEmail(e.target.value)}
                disabled={isLateSubmitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="late-submit-repo-url">Repository URL</Label>
              <Input
                id="late-submit-repo-url"
                type="url"
                placeholder="https://github.com/user/repo"
                value={lateSubmitRepoUrl}
                onChange={(e) => setLateSubmitRepoUrl(e.target.value)}
                disabled={isLateSubmitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="late-submit-repo-name">Repository Name</Label>
              <Input
                id="late-submit-repo-name"
                type="text"
                placeholder="my-assignment-repo"
                value={lateSubmitRepoName}
                onChange={(e) => setLateSubmitRepoName(e.target.value)}
                disabled={isLateSubmitting}
                required
              />
            </div>
            {lateSubmitError && (
              <p className="text-sm text-red-500">{lateSubmitError}</p>
            )}
          </div>
          <DialogFooter className="sm:justify-between">
            <DialogClose asChild>
              <Button variant="outline" disabled={isLateSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleLateSubmit} disabled={isLateSubmitting}>
              {isLateSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isFindingUser
                ? "Finding User..."
                : adminSubmitAssignment.isPending
                ? "Submitting..."
                : "Submit for Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
