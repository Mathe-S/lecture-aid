"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { useCreateAssignment } from "@/hooks/useAssignments";
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
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AssignmentForm() {
  const { user } = useAuth();
  const createAssignment = useCreateAssignment();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  async function onSubmit(values: FormValues) {
    if (!user?.id) {
      toast.error("You must be logged in to create an assignment");
      return;
    }

    try {
      // First ensure user has lecturer role
      const supabase = createClient();

      // Check current user role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (roleError && roleError.code !== "PGRST116") {
        // PGRST116 is "no rows found"
        console.error("Error checking role:", roleError);
        toast.error("Error checking user role");
        return;
      }

      // If no role exists or role isn't lecturer/admin, set it
      if (!roleData || !["lecturer", "admin"].includes(roleData.role)) {
        console.log("Setting user role to lecturer");
        const { error: insertError } = await supabase
          .from("user_roles")
          .upsert({
            id: user.id,
            role: "lecturer",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error("Error setting role:", insertError);
          toast.error("Could not set user role");
          return;
        }

        // Give a moment for the role to propagate
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Now create assignment using snake_case column names
      const assignmentData = {
        title: values.title,
        description: values.description || null,
        due_date: values.dueDate ? values.dueDate.toISOString() : null,
        created_by: user.id,
      };

      console.log("Sending assignment data:", assignmentData);

      await createAssignment.mutateAsync(assignmentData as any);

      toast.success("Assignment created successfully");
      form.reset();
    } catch (error) {
      console.error("Assignment creation error:", error);
      toast.error("Failed to create assignment");
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
      </form>
    </Form>
  );
}
