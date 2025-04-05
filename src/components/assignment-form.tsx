"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import {
  useCreateAssignment,
  useDownloadSubmissions,
} from "@/hooks/useAssignments";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Download, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  grade: z.number().min(0, "Grade must be a positive number").default(30),
});

type FormValues = z.infer<typeof formSchema>;

export function AssignmentForm() {
  const { user, role } = useAuth();
  const createAssignment = useCreateAssignment();
  const downloadSubmissions = useDownloadSubmissions();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const router = useRouter();
  const params = useParams();
  const assignmentId = params?.id as string;
  const isEditMode = !!assignmentId;
  const isLecturerOrAdmin = role === "lecturer" || role === "admin";
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      grade: 30,
    },
  });

  async function onSubmit(values: FormValues) {
    if (!user?.id) {
      toast.error("You must be logged in to create an assignment");
      return;
    }

    try {
      await createAssignment.mutateAsync({
        title: values.title,
        description: values.description || null,
        due_date: values.dueDate ? values.dueDate.toISOString() : null,
        grade: values.grade,
        created_by: user.id,
      });

      toast.success("Assignment created successfully");
      form.reset();
      router.push("/assignments");
    } catch (error) {
      console.error("Assignment creation error:", error);
      toast.error("Failed to create assignment");
    }
  }

  async function handleDownloadSubmissions() {
    if (!assignmentId) {
      toast.error("Assignment ID is required for download");
      return;
    }

    try {
      const blob = await downloadSubmissions.mutateAsync(assignmentId);
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      // Create a temporary anchor element
      const a = document.createElement("a");
      a.href = url;
      a.download = `assignment_submissions_${assignmentId}.csv`;
      // Append to the document
      document.body.appendChild(a);
      // Trigger a click on the element
      a.click();
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download submissions");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Problem Set 0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Submit your GitHub repository for Problem Set 0..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="grade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grade Points</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="3.0"
                  value={(field.value / 10).toFixed(1)}
                  onChange={(e) => {
                    const decimalValue = parseFloat(e.target.value) || 0;
                    const intValue = Math.round(decimalValue * 10);
                    field.onChange(intValue);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Due Date (Optional)</FormLabel>
              <Popover
                open={isDatePickerOpen}
                onOpenChange={setIsDatePickerOpen}
              >
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={`w-full pl-3 text-left font-normal ${
                        !field.value && "text-muted-foreground"
                      }`}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      field.onChange(date);
                      setIsDatePickerOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between items-center">
          <Button type="submit" disabled={createAssignment.isPending}>
            {createAssignment.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Assignment"
            )}
          </Button>

          {isEditMode && isLecturerOrAdmin && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadSubmissions}
              disabled={downloadSubmissions.isPending}
            >
              {downloadSubmissions.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Submissions
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
