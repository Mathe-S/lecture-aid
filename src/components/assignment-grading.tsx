"use client";

import { useState, useRef } from "react";
import {
  useCloseAssignment,
  useUploadGradesJson,
} from "@/hooks/useAssignments";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, Lock } from "lucide-react";
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

interface AssignmentGradingProps {
  assignment: Assignment;
}

export function AssignmentGrading({ assignment }: AssignmentGradingProps) {
  const [isGradingOpen, setIsGradingOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const closeAssignment = useCloseAssignment();
  const uploadGradesJson = useUploadGradesJson();

  const handleClose = async () => {
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

  const handleUpload = async () => {
    if (!selectedFile) {
      setFileError("Please select a JSON file to upload");
      return;
    }

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

      await uploadGradesJson.mutateAsync({
        assignmentId: assignment.id,
        gradesData,
      });

      toast.success("Grades uploaded successfully");
      setIsGradingOpen(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading grades:", error);
      toast.error("Failed to upload grades");
    }
  };

  return (
    <div className="flex space-x-2">
      <Button
        variant="outline"
        onClick={handleClose}
        disabled={closeAssignment.isPending}
      >
        {closeAssignment.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Closing...
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            Close Assignment
          </>
        )}
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
              Upload a JSON file with grading data for this assignment. This
              will apply grades to all student submissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="grade-file">Grading JSON File</Label>
              <Input
                id="grade-file"
                type="file"
                accept=".json,application/json"
                ref={fileInputRef}
                onChange={handleFileChange}
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
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploadGradesJson.isPending}
            >
              {uploadGradesJson.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload and Apply Grades"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
