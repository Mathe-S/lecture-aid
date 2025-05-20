"use client";

import {
  useAllFinalGroups,
  useJoinFinalGroup,
  useUserFinalGroup,
} from "@/hooks/useFinalUserGroup";
import type { FinalGroupWithDetails } from "@/lib/final-group-service";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, LogIn, ShieldCheck, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

interface GroupCardProps {
  group: FinalGroupWithDetails;
  currentUserId: string | undefined;
  isUserInAnyGroup: boolean;
  onJoinGroup: (groupId: string) => void;
  isJoiningGroupId: string | null; // ID of the group currently being joined
}

function GroupCard({
  group,
  currentUserId,
  isUserInAnyGroup,
  onJoinGroup,
  isJoiningGroupId,
}: GroupCardProps) {
  const isMember = group.members.some(
    (member) => member.profile.id === currentUserId
  );
  const canJoin = !isUserInAnyGroup && !isMember; // Can join if user is not in any group AND not already a member of this specific group
  const isProcessingJoin = isJoiningGroupId === group.id;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{group.name}</CardTitle>
          <Badge variant="outline" className="whitespace-nowrap">
            <Users className="w-3 h-3 mr-1.5" /> {group.members.length} Member
            {group.members.length === 1 ? "" : "s"}
          </Badge>
        </div>
        {group.description && (
          <CardDescription className="text-xs mt-1">
            {group.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow space-y-2 text-sm">
        <div>
          <span className="font-medium text-muted-foreground text-xs">
            Owner:
          </span>
          <div className="flex items-center space-x-2 mt-0.5">
            <Avatar className="h-5 w-5">
              <AvatarImage
                src={group.owner.avatarUrl || undefined}
                alt={group.owner.fullName || "Owner"}
              />
              <AvatarFallback>
                {getInitials(group.owner.fullName)}
              </AvatarFallback>
            </Avatar>
            <span>{group.owner.fullName || group.owner.email || "N/A"}</span>
          </div>
        </div>
        {group.selectedProject && (
          <div>
            <span className="font-medium text-muted-foreground text-xs">
              Project:
            </span>
            <p
              className="text-slate-700 font-medium truncate"
              title={group.selectedProject.title}
            >
              {group.selectedProject.title}
            </p>
            <p className="text-xs text-slate-500">
              Category: {group.selectedProject.category}
            </p>
          </div>
        )}
        {!group.selectedProject && (
          <p className="text-xs text-slate-500 italic">
            No project selected yet.
          </p>
        )}
      </CardContent>
      <CardFooter>
        {canJoin && (
          <Button
            onClick={() => onJoinGroup(group.id)}
            disabled={isProcessingJoin}
            className="w-full"
            size="sm"
          >
            {isProcessingJoin ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            Join Group
          </Button>
        )}
        {isMember && (
          <div className="flex items-center text-green-600 text-sm font-medium w-full justify-center">
            <CheckCircle className="mr-2 h-4 w-4" /> You are a member
          </div>
        )}
        {/* Could add more states, e.g., "Group Full" if that logic is implemented */}
      </CardFooter>
    </Card>
  );
}

export function AllFinalGroupsList() {
  const { user } = useAuth();
  const {
    data: allGroups,
    isLoading: isLoadingAllGroups,
    isError: isErrorAllGroups,
    error: errorAllGroups,
    refetch: refetchAllGroups,
  } = useAllFinalGroups();
  const { data: userGroupData } = useUserFinalGroup(); // To check if current user is already in a group
  const {
    mutate: joinGroup,
    isPending: isJoiningGroup,
    variables: joiningVariables,
  } = useJoinFinalGroup();

  const handleJoinGroup = (groupId: string) => {
    if (userGroupData) {
      // Should not happen if button is disabled, but double check
      toast.error("You are already in a group.");
      return;
    }
    joinGroup({ groupId });
  };

  if (isLoadingAllGroups) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-slate-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-4 bg-slate-200 rounded w-full"></div>
              <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            </CardContent>
            <CardFooter>
              <div className="h-8 bg-slate-200 rounded w-full"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (isErrorAllGroups) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error Loading Groups</AlertTitle>
        <AlertDescription>
          {errorAllGroups?.message || "An unexpected error occurred."}
          <Button
            onClick={() => refetchAllGroups()}
            variant="outline"
            size="sm"
            className="ml-2"
          >
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!allGroups || allGroups.length === 0) {
    return (
      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>No Groups Found</AlertTitle>
        <AlertDescription>
          There are currently no final project groups available. Why not create
          one?
        </AlertDescription>
      </Alert>
    );
  }

  const isUserInAnyGroup = !!userGroupData;
  const joiningGroupId =
    isJoiningGroup && joiningVariables ? joiningVariables.groupId : null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">
        Available Final Project Groups ({allGroups.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {allGroups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            currentUserId={user?.id}
            isUserInAnyGroup={isUserInAnyGroup}
            onJoinGroup={handleJoinGroup}
            isJoiningGroupId={joiningGroupId}
          />
        ))}
      </div>
    </div>
  );
}
