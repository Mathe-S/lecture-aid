"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import {
  useCreateAssignment,
  useUpdateAssignment,
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
import {
  CalendarIcon,
  Download,
  Loader2,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Assignment } from "@/db/drizzle/schema";

const customFieldSchema = z.object({
  label: z.string().min(1, "Label is required"),
});

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  grade: z.number().min(0, "Grade must be a positive number").default(30),
  customFields: z.array(customFieldSchema).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AssignmentFormProps {
  assignmentData?: Assignment;
}

export function AssignmentForm({ assignmentData }: AssignmentFormProps) {
  const { user, role } = useAuth();
  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();
  const downloadSubmissions = useDownloadSubmissions();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const router = useRouter();
  const isEditMode = !!assignmentData;
  const isLecturerOrAdmin = role === "lecturer" || role === "admin";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      grade: 30,
      customFields: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "customFields",
  });

  // Set form values when editing
  useEffect(() => {
    if (assignmentData) {
      form.reset({
        title: assignmentData.title,
        description: assignmentData.description || undefined,
        dueDate: assignmentData.due_date
          ? new Date(assignmentData.due_date)
          : undefined,
        grade: assignmentData.grade,
        customFields: [], // Placeholder for now
      });
    }
  }, [assignmentData, form]);

  async function onSubmit(values: FormValues) {
    if (!user?.id) {
      toast.error("You must be logged in to create an assignment");
      return;
    }

    try {
      if (isEditMode && assignmentData) {
        // Update existing assignment
        await updateAssignment.mutateAsync({
          id: assignmentData.id,
          data: {
            title: values.title,
            description: values.description || null,
            due_date: values.dueDate ? values.dueDate.toISOString() : null,
            grade: values.grade,
            updatedAt: new Date().toISOString(),
            customFields: values.customFields,
          },
        });
        toast.success("Assignment updated successfully");
        router.push(`/assignments/${assignmentData.id}`);
      } else {
        // Create new assignment
        await createAssignment.mutateAsync({
          title: values.title,
          description: values.description || null,
          due_date: values.dueDate ? values.dueDate.toISOString() : null,
          grade: values.grade,
          created_by: user.id,
          closed: false,
          customFields: values.customFields,
        });
        toast.success("Assignment created successfully");
        form.reset();
        router.push("/assignments");
      }
    } catch (error) {
      console.error("Assignment operation error:", error);
      toast.error(
        isEditMode
          ? "Failed to update assignment"
          : "Failed to create assignment"
      );
    }
  }

  async function handleDownloadSubmissions() {
    if (!assignmentData?.id) {
      toast.error("Assignment ID is required for download");
      return;
    }

    try {
      const blob = await downloadSubmissions.mutateAsync(assignmentData.id);
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      // Create a temporary anchor element
      const a = document.createElement("a");
      a.href = url;
      a.download = `assignment_submissions_${assignmentData.id}.csv`;
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
                  step="1"
                  placeholder="3"
                  value={field.value}
                  onChange={(e) => {
                    const intValue = parseInt(e.target.value) || 0;
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

        {/* Custom Fields Section */}
        <div>
          <FormLabel>Custom Fields</FormLabel>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center space-x-2 mt-2">
              <FormField
                control={form.control}
                name={`customFields.${index}.label`}
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <Input
                        placeholder="e.g., GitHub Repository URL"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => append({ label: "" })}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Custom Field
          </Button>
        </div>

        <div className="flex justify-between items-center">
          <Button
            type="submit"
            disabled={createAssignment.isPending || updateAssignment.isPending}
          >
            {isEditMode ? (
              updateAssignment.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Assignment"
              )
            ) : createAssignment.isPending ? (
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
