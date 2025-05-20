"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCreateFinalGroup } from "@/hooks/useFinalUserGroup";
import { Loader2 } from "lucide-react";

const createGroupFormSchema = z.object({
  name: z
    .string()
    .min(3, "Group name must be at least 3 characters.")
    .max(50, "Group name must be 50 characters or less."),
  // description: z.string().max(200, "Description must be 200 characters or less.").optional(),
});

type CreateGroupFormValues = z.infer<typeof createGroupFormSchema>;

export function CreateFinalGroupForm() {
  const { mutate: createGroup, isPending } = useCreateFinalGroup();

  const form = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupFormSchema),
    defaultValues: {
      name: "",
      // description: "",
    },
  });

  function onSubmit(values: CreateGroupFormValues) {
    createGroup(values);
    // The onSuccess in the hook will invalidate queries, no need to reset form here
    // unless UX dictates immediate reset before feedback.
  }

  return (
    <div className="max-w-md mx-auto p-6 border rounded-lg shadow-sm bg-card">
      <h3 className="text-xl font-semibold mb-4 text-center">
        Create Your Final Project Group
      </h3>
      <p className="text-sm text-muted-foreground mb-6 text-center">
        Choose a name for your group. You will be the owner and can invite
        members later.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Group Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., The Innovators" {...field} />
                </FormControl>
                <FormDescription>
                  This will be the public name for your group.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* 
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Group Description (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Short description of your group or project idea" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          */}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Group
          </Button>
        </form>
      </Form>
    </div>
  );
}
