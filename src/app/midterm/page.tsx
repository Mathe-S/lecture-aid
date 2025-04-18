"use client";

import { useState, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  useMidtermGroups,
  useCreateMidtermGroup,
  useJoinMidtermGroup,
  useConnectRepository,
  useUpdateRepository,
  useLeaveGroup,
  useDeleteMidtermGroup,
  useUpdateMidtermGroup,
} from "@/hooks/useMidtermGroups";
import {
  MidtermGroupWithMembers,
  MidtermGroup,
} from "@/db/drizzle/midterm-schema";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ProjectOverviewCard } from "@/components/midterm/project-overview-card";
import { YourGroupsList } from "@/components/midterm/your-groups-list";
import { AvailableGroupsList } from "@/components/midterm/available-groups-list";
import { UserRole } from "@/types/general";

// --- Loading Skeleton Component ---
function GroupsLoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-1/4" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

// --- Main Midterm Page Component ---
export default function MidtermPage() {
  const { user, role } = useAuth();

  // --- State Variables ---
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedGroupForEdit, setSelectedGroupForEdit] =
    useState<MidtermGroupWithMembers | null>(null);

  // --- Hooks ---
  const {
    data: groups = [],
    refetch: refetchGroups,
    isLoading: isLoadingGroups,
    error: groupsError,
  } = useMidtermGroups();

  const { mutateAsync: createGroup, isPending: isCreatingGroup } =
    useCreateMidtermGroup();
  const { mutateAsync: joinGroup, isPending: isJoiningGroup } =
    useJoinMidtermGroup();
  const { mutateAsync: connectRepository, isPending: isConnectingRepo } =
    useConnectRepository();
  const { mutateAsync: updateRepository, isPending: isUpdatingRepo } =
    useUpdateRepository();
  const { mutateAsync: updateGroup, isPending: isUpdatingGroup } =
    useUpdateMidtermGroup();
  const { mutateAsync: leaveGroup, isPending: isLeavingGroup } =
    useLeaveGroup();
  const { mutateAsync: deleteGroup, isPending: isDeletingGroup } =
    useDeleteMidtermGroup();

  // --- Derived State ---
  const userGroups = groups.filter((group) =>
    group.members.some((member) => member.userId === user?.id)
  );
  const availableGroups = groups.filter(
    (group) => !group.members.some((member) => member.userId === user?.id)
  );

  // --- Handlers ---
  const handleCreateGroup = async (
    name: string,
    description: string
  ): Promise<MidtermGroup | null> => {
    if (!name.trim()) {
      toast.error("Group name cannot be empty.");
      return null;
    }
    try {
      const newGroup = await createGroup({
        name,
        description: description || undefined,
      });
      toast.success("Group created successfully!");
      return newGroup;
    } catch (error: any) {
      console.error("Failed to create group (handler level)", error);
      return null;
    }
  };

  const handleUpdateGroup = async (
    groupId: string,
    name: string,
    description: string
  ): Promise<void> => {
    if (!groupId || !name.trim()) {
      toast.error("Group ID missing or Group name cannot be empty.");
      return;
    }
    try {
      await updateGroup({ groupId, name, description });
      toast.success("Group updated successfully!");
      setSelectedGroupForEdit(null);
      refetchGroups();
    } catch (error: any) {
      toast.error(
        `Failed to update group: ${error?.message || "Unknown error"}`
      );
      console.error("Failed to update group", error);
    }
  };

  const handleJoinGroup = async (groupId: string): Promise<void> => {
    try {
      await joinGroup(groupId);
      toast.success("Successfully joined group!");
    } catch (error: any) {
      console.error("Failed to join group (handler level)", error);
    }
  };

  const handleConnectRepository = async (
    groupId: string,
    repoUrl: string
  ): Promise<void> => {
    if (!repoUrl.trim() || !repoUrl.includes("github.com")) {
      toast.error("Please enter a valid GitHub repository URL.");
      return;
    }
    try {
      await connectRepository({ groupId, repositoryUrl: repoUrl });
      toast.success("Repository connected successfully!");
      refetchGroups();
    } catch (error: any) {
      toast.error(
        `Failed to connect repository: ${error?.message || "Unknown error"}`
      );
      console.error("Failed to connect repository", error);
    }
  };

  const handleUpdateRepository = async (
    groupId: string,
    repoUrl: string
  ): Promise<void> => {
    if (!repoUrl.trim() || !repoUrl.includes("github.com")) {
      toast.error("Please enter a valid GitHub repository URL.");
      return;
    }
    try {
      await updateRepository({ groupId, repositoryUrl: repoUrl });
      toast.success("Repository updated successfully!");
      refetchGroups();
    } catch (error: any) {
      toast.error(
        `Failed to update repository: ${error?.message || "Unknown error"}`
      );
      console.error("Failed to update repository", error);
    }
  };

  const handleLeaveGroup = async (groupId: string): Promise<void> => {
    if (!groupId) return;
    try {
      await leaveGroup(groupId);
      toast.success("Successfully left the group.");
    } catch (error: any) {
      console.error("Failed to leave group (handler level)", error);
    }
  };

  const handleDeleteGroup = async (groupId: string): Promise<void> => {
    if (!groupId) return;
    try {
      await deleteGroup(groupId);
      toast.success("Group deleted successfully.");
    } catch (error: any) {
      console.error("Failed to delete group (handler level)", error);
    }
  };

  // --- Render Logic ---
  return (
    <main className="container mx-auto py-10 px-4 md:px-6">
      <div className="space-y-8">
        {/* Static Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Midterm Project</h1>
          <p className="text-muted-foreground">
            Create or join a group for your midterm project. Track your progress
            and visualize your contributions.
          </p>
        </div>

        {/* Use ProjectOverviewCard component */}
        <ProjectOverviewCard />

        {/* Your Groups Section - Use YourGroupsList component */}
        <Suspense fallback={<GroupsLoadingSkeleton count={1} />}>
          <YourGroupsList
            userGroups={userGroups}
            isLoading={isLoadingGroups}
            error={groupsError}
            user={user}
            role={role as UserRole}
            showCreateDialog={showCreateDialog}
            setShowCreateDialog={setShowCreateDialog}
            handleCreateGroup={handleCreateGroup}
            isCreatingGroup={isCreatingGroup}
            selectedGroupForEdit={selectedGroupForEdit}
            setSelectedGroupForEdit={setSelectedGroupForEdit}
            handleUpdateGroup={handleUpdateGroup}
            isUpdatingGroup={isUpdatingGroup}
            handleConnectRepo={handleConnectRepository}
            isConnectingRepo={isConnectingRepo}
            handleUpdateRepo={handleUpdateRepository}
            isUpdatingRepoRepo={isUpdatingRepo}
            handleLeaveGroup={handleLeaveGroup}
            isLeavingGroup={isLeavingGroup}
            handleDeleteGroup={handleDeleteGroup}
            isDeletingGroup={isDeletingGroup}
          />
        </Suspense>

        {/* Available Groups Section - Use AvailableGroupsList component */}
        <Suspense fallback={<GroupsLoadingSkeleton count={3} />}>
          <AvailableGroupsList
            availableGroups={availableGroups}
            isLoading={isLoadingGroups}
            error={groupsError}
            user={user}
            role={role as UserRole}
            handleJoinGroup={handleJoinGroup}
            isJoiningGroup={isJoiningGroup}
          />
        </Suspense>
      </div>
    </main>
  );
}
