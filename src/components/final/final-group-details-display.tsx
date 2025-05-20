"use client";

import type {
  FinalGroupWithDetails,
  // ProfileDetails, // Included in FinalGroupMemberWithProfile
  FinalGroupMemberWithProfile,
} from "@/lib/final-group-service";
import { useAuth } from "@/context/AuthContext";
import {
  useLeaveFinalGroup,
  useRemoveFinalGroupMember,
} from "@/hooks/useFinalUserGroup";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Users,
  Crown,
  Swords,
  PlusCircle,
  LogOut,
  UserX,
  Loader2,
} from "lucide-react";

interface FinalGroupDetailsDisplayProps {
  group: FinalGroupWithDetails;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

interface MemberItemProps {
  member: FinalGroupMemberWithProfile;
  isCurrentUserOwner: boolean;
  currentUserId: string | undefined;
  onRemoveMember: (memberId: string) => void;
  isRemovingMember: boolean;
}

function MemberItem({
  member,
  isCurrentUserOwner,
  currentUserId,
  onRemoveMember,
  isRemovingMember,
}: MemberItemProps) {
  const isSelf = member.profile.id === currentUserId;
  return (
    <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-md">
      <div className="flex items-center space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={member.profile.avatarUrl || undefined}
            alt={member.profile.fullName || "User"}
          />
          <AvatarFallback>
            {getInitials(member.profile.fullName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">
            {member.profile.fullName || member.profile.email || "-"}
            {isSelf && (
              <span className="text-xs text-muted-foreground ml-1">(You)</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {member.profile.email}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge
          variant={member.role === "owner" ? "default" : "secondary"}
          className="capitalize"
        >
          {member.role === "owner" && <Crown className="w-3 h-3 mr-1.5" />}
          {member.role}
        </Badge>
        {isCurrentUserOwner && !isSelf && member.role !== "owner" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600"
                disabled={isRemovingMember}
              >
                {isRemovingMember ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserX className="w-4 h-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will remove{" "}
                  {member.profile.fullName || "this member"} from the group.
                  This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onRemoveMember(member.profile.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Remove Member
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}

export function FinalGroupDetailsDisplay({
  group,
}: FinalGroupDetailsDisplayProps) {
  const { user } = useAuth();
  const { owner, members, selectedProject } = group;
  const isCurrentUserOwner = user?.id === owner.id;

  const { mutate: leaveGroup, isPending: isLeavingGroup } =
    useLeaveFinalGroup();
  const { mutate: removeMember, isPending: isRemovingMember } =
    useRemoveFinalGroupMember();

  const handleLeaveGroup = () => {
    leaveGroup();
  };

  const handleRemoveMember = (memberId: string) => {
    removeMember({ groupId: group.id, memberId });
  };

  const otherMembers = members.filter((m) => m.profile.id !== owner.id);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">{group.name}</CardTitle>
          <Badge variant="outline">
            <Users className="w-4 h-4 mr-1.5" /> {members.length} Member
            {members.length === 1 ? "" : "s"}
          </Badge>
        </div>
        {group.description && (
          <CardDescription className="pt-1">
            {group.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            OWNER
          </h4>
          <MemberItem
            member={{
              profile: owner,
              role: "owner",
              joinedAt:
                members.find((m) => m.profile.id === owner.id)?.joinedAt || "",
            }}
            isCurrentUserOwner={isCurrentUserOwner}
            currentUserId={user?.id}
            onRemoveMember={handleRemoveMember} // Owner can't remove self here
            isRemovingMember={false} // Not applicable for owner item itself
          />
        </div>

        {otherMembers.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              MEMBERS ({otherMembers.length})
            </h4>
            <div className="space-y-1">
              {otherMembers.map((member) => (
                <MemberItem
                  key={member.profile.id}
                  member={member}
                  isCurrentUserOwner={isCurrentUserOwner}
                  currentUserId={user?.id}
                  onRemoveMember={handleRemoveMember}
                  isRemovingMember={isRemovingMember}
                />
              ))}
            </div>
          </div>
        )}
        {members.length === 1 && members[0].profile.id === owner.id && (
          <p className="text-sm text-muted-foreground">
            You are the only member in this group.
          </p>
        )}

        {selectedProject && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              SELECTED PROJECT
            </h4>
            <div className="p-3 border rounded-md bg-slate-50">
              <p className="font-semibold text-slate-800">
                {selectedProject.title}
              </p>
              <p className="text-xs text-slate-600">
                Category: {selectedProject.category}
              </p>
            </div>
          </div>
        )}
        {!selectedProject && (
          <div className="p-3 border border-dashed rounded-md text-center">
            <p className="text-muted-foreground text-sm">
              No project selected yet.
            </p>
            {isCurrentUserOwner && (
              <Button variant="outline" size="sm" className="mt-2" disabled>
                {" "}
                {/* TODO: Implement Select Project */}
                <PlusCircle className="w-4 h-4 mr-1.5 text-green-600" /> Select
                Project
              </Button>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          Created: {new Date(group.createdAt).toLocaleDateString()}
        </p>
        <div className="flex gap-2 flex-wrap items-center">
          {/* Manage Members Button - for owner */}
          {isCurrentUserOwner && (
            <Button variant="outline" size="sm" disabled>
              {" "}
              {/* TODO: Could open a modal or expand section */}
              <Swords className="w-4 h-4 mr-1.5 text-blue-600" /> Manage Members
            </Button>
          )}

          {/* Leave Group Button - for everyone */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isLeavingGroup}>
                {isLeavingGroup ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4 mr-1.5" />
                )}
                Leave Group
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Are you sure you want to leave the group?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {isCurrentUserOwner && members.length > 1
                    ? "As the owner, you cannot leave if other members are present. You must transfer ownership or remove other members first."
                    : "This action cannot be undone. If you are the last member, the group may be deleted."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLeaveGroup}
                  disabled={isCurrentUserOwner && members.length > 1} // Disable if owner and not last member
                  className={
                    !(isCurrentUserOwner && members.length > 1)
                      ? "bg-red-600 hover:bg-red-700"
                      : ""
                  }
                >
                  Confirm Leave
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* TODO: These buttons are placeholders from before */}
          {/* <Button variant="outline" size="sm" disabled>
            <FileText className="w-4 h-4 mr-1.5 text-purple-600" /> Manage Tasks
          </Button> */}
        </div>
      </CardFooter>
    </Card>
  );
}
