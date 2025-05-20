"use client";

import {
  useUserFinalGroup,
  useJoinFinalGroup,
} from "@/hooks/useFinalUserGroup";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ServerCrash, LogIn } from "lucide-react";
import { CreateFinalGroupForm } from "./create-final-group-form";
import { FinalGroupDetailsDisplay } from "./final-group-details-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

export function MyFinalGroupPanel() {
  const {
    data: userGroup,
    isLoading,
    isError,
    error,
    refetch,
  } = useUserFinalGroup();
  console.log("🚀 ~ MyFinalGroupPanel ~ userGroup:", userGroup);
  const { mutate: joinGroup, isPending: isJoiningGroup } = useJoinFinalGroup();
  const [groupIdToJoin, setGroupIdToJoin] = useState("");

  const handleJoinGroup = () => {
    if (!groupIdToJoin.trim()) {
      toast.error("Please enter a Group ID to join.");
      return;
    }
    joinGroup({ groupId: groupIdToJoin.trim() });
  };

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
    // User is not in a group, show creation form and join group option
    return (
      <div className="space-y-8">
        <CreateFinalGroupForm />
        <div className="max-w-md mx-auto p-6 border rounded-lg shadow-sm bg-card">
          <h3 className="text-xl font-semibold mb-4 text-center">
            Join an Existing Group
          </h3>
          <p className="text-sm text-muted-foreground mb-6 text-center">
            If you have a Group ID, enter it below to send a join request or
            join directly.
          </p>
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Enter Group ID"
              value={groupIdToJoin}
              onChange={(e) => setGroupIdToJoin(e.target.value)}
              disabled={isJoiningGroup}
            />
            <Button
              onClick={handleJoinGroup}
              disabled={isJoiningGroup || !groupIdToJoin.trim()}
            >
              {isJoiningGroup ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Join Group
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
