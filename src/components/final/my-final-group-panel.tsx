"use client";

import { useUserFinalGroup } from "@/hooks/useFinalUserGroup";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ServerCrash } from "lucide-react";
import { CreateFinalGroupForm } from "./create-final-group-form";
import { FinalGroupDetailsDisplay } from "./final-group-details-display";
import { AllFinalGroupsList } from "./all-final-groups-list";

export function MyFinalGroupPanel() {
  const {
    data: userGroup,
    isLoading,
    isError,
    error,
    refetch,
  } = useUserFinalGroup();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <p className="ml-2 text-muted-foreground">
          Loading your group status...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <ServerCrash className="h-4 w-4" />
        <AlertTitle>Error Loading Group Information</AlertTitle>
        <AlertDescription>
          {error?.message || "An unexpected error occurred."}
          <button onClick={() => refetch()} className="ml-2 text-sm underline">
            Try again
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  if (userGroup) {
    // User is in a group, display its details
    return <FinalGroupDetailsDisplay group={userGroup} />;
  } else {
    // User is not in a group, show creation form and the list of all available groups to join
    return (
      <div className="space-y-12">
        <CreateFinalGroupForm />
        <div>
          <h3 className="text-xl font-semibold mb-4 text-center">
            Or Join an Existing Group
          </h3>
          <AllFinalGroupsList />
        </div>
      </div>
    );
  }
}
