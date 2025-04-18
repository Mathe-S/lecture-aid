"use client";

import React from "react";
import { MidtermGroupWithMembers } from "@/db/drizzle/midterm-schema";
import { User } from "@supabase/supabase-js";
import { GroupCard } from "./group-card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserRole } from "@/types/general";

interface AvailableGroupsListProps {
  availableGroups: MidtermGroupWithMembers[];
  isLoading: boolean;
  error: Error | null;
  user: User | null;
  role: UserRole;

  // Join Group Handler & Loading State
  handleJoinGroup: (groupId: string) => Promise<void>;
  isJoiningGroup: boolean;
}

// Helper Loading Skeleton (can be shared or redefined)
function GroupsLoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex flex-col space-y-3">
          <Skeleton className="h-[125px] w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AvailableGroupsList({
  availableGroups,
  isLoading,
  error,
  user,
  role,
  handleJoinGroup,
  isJoiningGroup,
}: AvailableGroupsListProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">
        Available Groups to Join
      </h2>

      {isLoading && <GroupsLoadingSkeleton />}
      {error && <p className="text-red-500">Error loading available groups.</p>}
      {!isLoading && !error && availableGroups.length === 0 && (
        <p className="text-muted-foreground italic">
          No other groups available to join currently.
        </p>
      )}

      {!isLoading && !error && availableGroups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              user={user}
              role={role}
              type="available" // Explicitly set type
              onJoinGroup={handleJoinGroup}
              isJoiningGroup={isJoiningGroup}
              // Provide dummy handlers/state for actions not relevant to 'available' cards
              onEditClick={() => {}}
              onConnectRepo={async () => {}}
              onUpdateRepo={async () => {}}
              onLeaveGroup={async () => {}}
              onDeleteGroup={async () => {}}
              isConnectingRepo={false}
              isUpdatingRepo={false}
              isLeavingGroup={false}
              isDeletingGroup={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
