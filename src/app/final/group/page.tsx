"use client";

import { Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUserFinalGroup } from "@/hooks/useFinalUserGroup";
import { GroupDashboard } from "@/components/final/group-dashboard";
import { AllFinalGroupsList } from "@/components/final/all-final-groups-list";
import { FinalTaskScoreCard } from "@/components/final/final-task-score-card";
import { Loader2 } from "lucide-react";

function GroupPageLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

function GroupPageContent() {
  const { data: userGroup, isLoading, error } = useUserFinalGroup();

  if (isLoading) {
    return <GroupPageLoading />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load group information</p>
        <p className="text-sm text-muted-foreground mt-2">
          Please try refreshing the page
        </p>
      </div>
    );
  }

  // User has a group - show the dashboard
  if (userGroup) {
    return <GroupDashboard group={userGroup} />;
  }

  // User doesn't have a group - show available groups
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-2">Join a Group</h2>
        <p className="text-muted-foreground">
          You&apos;re not in a final project group yet. Join an existing group
          or create one from the Projects page.
        </p>
      </div>
      <Suspense fallback={<GroupPageLoading />}>
        <AllFinalGroupsList />
      </Suspense>
    </div>
  );
}

export default function GroupPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto py-10 px-4 md:px-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Please log in to view your group dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto py-10 px-4 md:px-6">
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Group Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage your final project, track progress, and collaborate with
              your team.
            </p>
          </div>

          {/* Final Task Score Card */}
          <div className="lg:w-80">
            <FinalTaskScoreCard showTitle={false} />
          </div>
        </div>

        <Suspense fallback={<GroupPageLoading />}>
          <GroupPageContent />
        </Suspense>
      </div>
    </main>
  );
}
