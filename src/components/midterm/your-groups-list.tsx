"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Loader2, Users, AlertTriangle } from "lucide-react";
import {
  MidtermGroupWithMembers,
  MidtermGroup,
} from "@/db/drizzle/midterm-schema";
import { User } from "@supabase/supabase-js";
import { GroupCard } from "./group-card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserRole } from "@/types/general";

interface YourGroupsListProps {
  userGroups: MidtermGroupWithMembers[];
  isLoading: boolean;
  error: Error | null;
  user: User | null;
  role: UserRole;

  // Create Group Dialog State & Handler
  showCreateDialog: boolean;
  setShowCreateDialog: (show: boolean) => void;
  handleCreateGroup: (
    name: string,
    description: string
  ) => Promise<MidtermGroup | null>;
  isCreatingGroup: boolean;

  // Edit Group Dialog State & Handler
  selectedGroupForEdit: MidtermGroupWithMembers | null;
  setSelectedGroupForEdit: (group: MidtermGroupWithMembers | null) => void;
  handleUpdateGroup: (
    groupId: string,
    name: string,
    description: string
  ) => Promise<void>;
  isUpdatingGroup: boolean;

  // Group Card Action Handlers & Loading States
  handleConnectRepo: (groupId: string, repoUrl: string) => Promise<void>;
  isConnectingRepo: boolean;
  handleUpdateRepo: (groupId: string, repoUrl: string) => Promise<void>;
  isUpdatingRepoRepo: boolean;
  handleLeaveGroup: (groupId: string) => Promise<void>;
  isLeavingGroup: boolean;
  handleDeleteGroup: (groupId: string) => Promise<void>;
  isDeletingGroup: boolean;
}

function GroupsLoadingSkeleton({ count = 2 }: { count?: number }) {
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

export function YourGroupsList({
  userGroups,
  isLoading,
  error,
  user,
  role,
  showCreateDialog,
  setShowCreateDialog,
  handleCreateGroup,
  isCreatingGroup,
  selectedGroupForEdit,
  setSelectedGroupForEdit,
  handleUpdateGroup,
  isUpdatingGroup,
  handleConnectRepo,
  isConnectingRepo,
  handleUpdateRepo,
  isUpdatingRepoRepo,
  handleLeaveGroup,
  isLeavingGroup,
  handleDeleteGroup,
  isDeletingGroup,
}: YourGroupsListProps) {
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");

  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupDescription, setEditGroupDescription] = useState("");

  React.useEffect(() => {
    if (selectedGroupForEdit) {
      setEditGroupName(selectedGroupForEdit.name);
      setEditGroupDescription(selectedGroupForEdit.description || "");
    } else {
      setEditGroupName("");
      setEditGroupDescription("");
    }
  }, [selectedGroupForEdit]);

  const handleCreateSubmit = async () => {
    const newGroup = await handleCreateGroup(newGroupName, newGroupDescription);
    if (newGroup) {
      setShowCreateDialog(false);
      setNewGroupName("");
      setNewGroupDescription("");
    }
  };

  const handleEditSubmit = () => {
    if (!selectedGroupForEdit) return;
    handleUpdateGroup(
      selectedGroupForEdit.id,
      editGroupName,
      editGroupDescription
    ).then(() => {
      setSelectedGroupForEdit(null);
    });
  };

  const handleEditClick = (group: MidtermGroupWithMembers) => {
    setSelectedGroupForEdit(group);
  };

  const EditGroupDialog = (
    <Dialog
      open={!!selectedGroupForEdit}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedGroupForEdit(null);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Group</DialogTitle>
          <DialogDescription>
            Update the name and description of your group.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-name" className="text-right">
              Name
            </Label>
            <Input
              id="edit-name"
              value={editGroupName}
              onChange={(e) => setEditGroupName(e.target.value)}
              className="col-span-3"
              maxLength={50}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-description" className="text-right">
              Description
            </Label>
            <Textarea
              id="edit-description"
              value={editGroupDescription}
              onChange={(e) => setEditGroupDescription(e.target.value)}
              className="col-span-3"
              maxLength={100}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setSelectedGroupForEdit(null)}
          >
            Cancel
          </Button>
          <Button onClick={handleEditSubmit} disabled={isUpdatingGroup}>
            {isUpdatingGroup ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold tracking-tight">
          Your Project Groups
        </h2>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setNewGroupName("");
                setNewGroupDescription("");
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create a New Project Group</DialogTitle>
              <DialogDescription>
                Create a new group for your midterm project. You&apos;ll be
                automatically added as the owner.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  maxLength={50}
                  placeholder="e.g., Project Dissapointment"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">
                  Group Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  maxLength={100}
                  placeholder="Me and my broken code"
                  className="w-full"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateSubmit} disabled={isCreatingGroup}>
                {isCreatingGroup ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Creating...
                  </>
                ) : (
                  "Create Group"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <GroupsLoadingSkeleton count={1} />}

      {error && (
        <Card className="mt-4">
          <CardContent className="p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-red-700">
              Error Loading Groups
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              There was a problem fetching your groups. Please try again later.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && userGroups.length === 0 && (
        <Card className="mt-4">
          <CardContent className="p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium">No Groups Yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              You haven&apos;t created or joined any project groups yet.
            </p>
            <Button
              className="mt-4"
              onClick={() => {
                setNewGroupName("");
                setNewGroupDescription("");
                setShowCreateDialog(true);
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Group
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && userGroups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              user={user}
              role={role}
              type="user"
              onEditClick={handleEditClick}
              onConnectRepo={handleConnectRepo}
              onUpdateRepo={handleUpdateRepo}
              onLeaveGroup={handleLeaveGroup}
              onDeleteGroup={handleDeleteGroup}
              isConnectingRepo={isConnectingRepo}
              isUpdatingRepo={isUpdatingRepoRepo}
              isLeavingGroup={isLeavingGroup}
              isDeletingGroup={isDeletingGroup}
              onJoinGroup={async () => {}}
              isJoiningGroup={false}
            />
          ))}
        </div>
      )}

      {EditGroupDialog}
    </div>
  );
}
