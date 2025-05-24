import { db } from "@/db";
import {
  finalGroups,
  finalGroupMembers,
  finalProjects,
  NewFinalGroup,
  NewFinalGroupMember,
  FinalProject as FinalProjectType, // Renamed to avoid conflict if FinalProject is used as a var name
} from "@/db/drizzle/final-schema";
import { profiles } from "@/db/drizzle/schema"; // Corrected imports
import { eq, and } from "drizzle-orm";

// Custom interface for service layer return type
export interface ProfileDetails {
  id: string;
  email: string | null; // email can be null in profiles schema
  fullName: string | null; // fullName can be null
  avatarUrl: string | null; // avatarUrl can be null
}

export interface FinalGroupMemberWithProfile {
  profile: ProfileDetails;
  role: "owner" | "member";
  joinedAt: string; // from finalGroupMembers.joined_at
  // userId and groupId are implicitly part of the relation context
}

export interface FinalGroupWithDetails {
  id: string;
  name: string;
  description: string | null;
  selectedProject: Pick<FinalProjectType, "id" | "title" | "category"> | null;
  projectIdea: string | null; // Markdown content for the group's project idea
  repositoryUrl: string | null;
  // Other finalGroups fields if needed
  owner: ProfileDetails; // Derived owner's profile
  members: FinalGroupMemberWithProfile[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Creates a new final project group and adds the creator as the owner.
 * @param groupName The name of the group.
 * @param ownerUserId The ID of the user creating and owning the group.
 * @returns The newly created group with the owner as the first member.
 * @throws Error if the user is already in a group or if group creation fails.
 */
export async function createFinalGroup(
  groupName: string,
  ownerUserId: string
): Promise<FinalGroupWithDetails> {
  const existingMembership = await db.query.finalGroupMembers.findFirst({
    where: eq(finalGroupMembers.userId, ownerUserId),
  });

  if (existingMembership) {
    throw new Error("User is already in a final project group.");
  }

  // 1. Create the group
  // Ensure snake_case for column names if defined that way in schema
  const newGroupInsertData: Pick<NewFinalGroup, "name"> = {
    // Only include fields directly on final_groups
    name: groupName,
    // description, selected_project_id etc. can be added if provided
  };

  const [createdGroupRaw] = await db
    .insert(finalGroups)
    .values(newGroupInsertData)
    .returning();

  if (!createdGroupRaw || !createdGroupRaw.id) {
    throw new Error("Failed to create final project group.");
  }

  // 2. Add the owner to the group
  const newMemberInsertData: NewFinalGroupMember = {
    groupId: createdGroupRaw.id, // Use snake_case
    userId: ownerUserId, // Use snake_case
    role: "owner",
  };
  await db.insert(finalGroupMembers).values(newMemberInsertData);

  // 3. Fetch the newly created group with all details
  // Drizzle uses relation names defined in your relations.ts / final-schema.ts
  // final-schema.ts shows finalGroupMembers.user relation to profiles table
  const groupDetailsFromDb = await db.query.finalGroups.findFirst({
    where: eq(finalGroups.id, createdGroupRaw.id),
    with: {
      selectedProject: {
        columns: { id: true, title: true, category: true },
      },
      members: {
        // Relation name for finalGroupMembers
        columns: { role: true, joinedAt: true }, // Columns from final_group_members
        with: {
          user: {
            // Relation name from finalGroupMembers to profiles
            columns: {
              id: true,
              email: true,
              fullName: true, // from profiles.fullName
              avatarUrl: true, // from profiles.avatarUrl
            },
          },
        },
      },
    },
  });

  if (
    !groupDetailsFromDb ||
    !groupDetailsFromDb.members ||
    groupDetailsFromDb.members.length === 0
  ) {
    // This should not happen if inserts were successful
    await db.delete(finalGroups).where(eq(finalGroups.id, createdGroupRaw.id)); // Rollback attempt
    throw new Error(
      "Failed to retrieve newly created group details or members are empty."
    );
  }

  const ownerMemberData = groupDetailsFromDb.members.find(
    (m) => m.user?.id === ownerUserId && m.role === "owner"
  );

  if (!ownerMemberData || !ownerMemberData.user) {
    // Critical error, owner not found after insertion
    await db.delete(finalGroups).where(eq(finalGroups.id, createdGroupRaw.id)); // Rollback attempt
    throw new Error(
      "Failed to associate owner profile with the newly created group."
    );
  }
  const ownerProfile = ownerMemberData.user;

  const mappedMembers: FinalGroupMemberWithProfile[] =
    groupDetailsFromDb.members
      .filter((member) => member.user)
      .map((member) => ({
        profile: {
          id: member.user!.id,
          email: member.user!.email,
          fullName: member.user!.fullName,
          avatarUrl: member.user!.avatarUrl,
        },
        role: member.role as "owner" | "member",
        joinedAt: member.joinedAt,
      }));

  return {
    id: groupDetailsFromDb.id,
    name: groupDetailsFromDb.name,
    description: groupDetailsFromDb.description,
    selectedProject: groupDetailsFromDb.selectedProject
      ? {
          id: groupDetailsFromDb.selectedProject.id,
          title: groupDetailsFromDb.selectedProject.title,
          category: groupDetailsFromDb.selectedProject.category,
        }
      : null,
    projectIdea: groupDetailsFromDb.projectIdea,
    repositoryUrl: groupDetailsFromDb.repositoryUrl,
    owner: {
      id: ownerProfile.id,
      email: ownerProfile.email,
      fullName: ownerProfile.fullName,
      avatarUrl: ownerProfile.avatarUrl,
    },
    members: mappedMembers,
    createdAt: groupDetailsFromDb.createdAt, // Already a string
    updatedAt: groupDetailsFromDb.updatedAt, // Already a string
  };
}

/**
 * Fetches the final project group for a given user, if they are part of one.
 * @param userId The ID of the user.
 * @returns The user's group with details, or null if not in a group.
 */
export async function getUserFinalGroup(
  userId: string
): Promise<FinalGroupWithDetails | null> {
  const userGroupMembership = await db.query.finalGroupMembers.findFirst({
    where: eq(finalGroupMembers.userId, userId), // Drizzle infers user_id from schema
    columns: { groupId: true }, // Use snake_case
  });

  if (!userGroupMembership || !userGroupMembership.groupId) {
    return null; // User is not in any final group
  }

  const groupDetailsFromDb = await db.query.finalGroups.findFirst({
    where: eq(finalGroups.id, userGroupMembership.groupId),
    with: {
      selectedProject: {
        columns: { id: true, title: true, category: true },
      },
      members: {
        columns: { role: true, joinedAt: true },
        with: {
          user: {
            // This 'user' is the relation from finalGroupMembers to profiles
            columns: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  if (
    !groupDetailsFromDb ||
    !groupDetailsFromDb.members ||
    groupDetailsFromDb.members.length === 0
  ) {
    // This might indicate an orphaned membership
    console.error(
      "Group details not found or members list empty for user " +
        userId +
        " and group " +
        userGroupMembership.groupId
    );
    return null;
  }

  const ownerMemberData = groupDetailsFromDb.members.find(
    (m) => m.role === "owner"
  );
  if (!ownerMemberData || !ownerMemberData.user) {
    console.error(
      "Group " +
        groupDetailsFromDb.id +
        " found without an owner or owner profile."
    );
    return null;
  }
  const ownerProfile = ownerMemberData.user;

  const mappedMembers: FinalGroupMemberWithProfile[] =
    groupDetailsFromDb.members
      .filter((member) => member.user)
      .map((member) => ({
        profile: {
          id: member.user!.id,
          email: member.user!.email,
          fullName: member.user!.fullName,
          avatarUrl: member.user!.avatarUrl,
        },
        role: member.role as "owner" | "member",
        joinedAt: member.joinedAt,
      }));

  return {
    id: groupDetailsFromDb.id,
    name: groupDetailsFromDb.name,
    description: groupDetailsFromDb.description,
    selectedProject: groupDetailsFromDb.selectedProject
      ? {
          id: groupDetailsFromDb.selectedProject.id,
          title: groupDetailsFromDb.selectedProject.title,
          category: groupDetailsFromDb.selectedProject.category,
        }
      : null,
    projectIdea: groupDetailsFromDb.projectIdea,
    repositoryUrl: groupDetailsFromDb.repositoryUrl,
    owner: {
      id: ownerProfile.id,
      email: ownerProfile.email,
      fullName: ownerProfile.fullName,
      avatarUrl: ownerProfile.avatarUrl,
    },
    members: mappedMembers,
    createdAt: groupDetailsFromDb.createdAt,
    updatedAt: groupDetailsFromDb.updatedAt,
  };
}

// TODO: Add other service functions:
// - joinFinalGroup(groupId: string, userId: string)
// - leaveFinalGroup(groupId: string, userId: string)
// - removeMemberFromFinalGroup(groupId: string, memberId: string, currentUserId: string) // owner action
// - selectProjectForFinalGroup(groupId: string, projectId: string, userId: string) // owner action
// - deleteFinalGroup(groupId: string, userId: string) // owner action
// - getAllFinalGroups() // For admins or for a "find a group" feature

/**
 * Allows a user to join an existing final project group.
 * @param groupId The ID of the group to join.
 * @param userId The ID of the user joining the group.
 * @returns The details of the group the user joined.
 * @throws Error if the user is already in a group, the group doesn't exist, or the group is full (not implemented yet).
 */
export async function joinFinalGroup(
  groupId: string,
  userId: string
): Promise<FinalGroupWithDetails> {
  // Check if user is already in a group
  const existingMembership = await db.query.finalGroupMembers.findFirst({
    where: eq(finalGroupMembers.userId, userId),
  });

  if (existingMembership) {
    throw new Error("User is already in a final project group.");
  }

  // Check if the group exists
  const groupToJoin = await db.query.finalGroups.findFirst({
    where: eq(finalGroups.id, groupId),
  });

  if (!groupToJoin) {
    throw new Error("Group not found.");
  }

  // TODO: Add check for max group size if applicable

  // Add user to the group as a member
  const newMemberInsertData: NewFinalGroupMember = {
    groupId: groupId,
    userId: userId,
    role: "member",
  };
  await db.insert(finalGroupMembers).values(newMemberInsertData);

  // Fetch and return the updated group details
  const updatedGroupDetails = await db.query.finalGroups.findFirst({
    where: eq(finalGroups.id, groupId),
    with: {
      selectedProject: {
        columns: { id: true, title: true, category: true },
      },
      members: {
        columns: { role: true, joinedAt: true },
        with: {
          user: {
            columns: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  if (
    !updatedGroupDetails ||
    !updatedGroupDetails.members ||
    updatedGroupDetails.members.length === 0
  ) {
    throw new Error("Failed to retrieve group details after joining.");
  }

  const ownerMemberData = updatedGroupDetails.members.find(
    (m) => m.role === "owner"
  );
  if (!ownerMemberData || !ownerMemberData.user) {
    throw new Error(
      "Group found without an owner or owner profile after joining."
    );
  }
  const ownerProfile = ownerMemberData.user;

  const mappedMembers: FinalGroupMemberWithProfile[] =
    updatedGroupDetails.members
      .filter((member) => member.user)
      .map((member) => ({
        profile: {
          id: member.user!.id,
          email: member.user!.email,
          fullName: member.user!.fullName,
          avatarUrl: member.user!.avatarUrl,
        },
        role: member.role as "owner" | "member",
        joinedAt: member.joinedAt,
      }));

  return {
    id: updatedGroupDetails.id,
    name: updatedGroupDetails.name,
    description: updatedGroupDetails.description,
    selectedProject: updatedGroupDetails.selectedProject
      ? {
          id: updatedGroupDetails.selectedProject.id,
          title: updatedGroupDetails.selectedProject.title,
          category: updatedGroupDetails.selectedProject.category,
        }
      : null,
    projectIdea: updatedGroupDetails.projectIdea,
    repositoryUrl: updatedGroupDetails.repositoryUrl,
    owner: {
      id: ownerProfile.id,
      email: ownerProfile.email,
      fullName: ownerProfile.fullName,
      avatarUrl: ownerProfile.avatarUrl,
    },
    members: mappedMembers,
    createdAt: updatedGroupDetails.createdAt,
    updatedAt: updatedGroupDetails.updatedAt,
  };
}

/**
 * Allows a user to leave their current final project group.
 * If the owner is the last member and leaves, the group is deleted.
 * An owner cannot leave if other members are present (must transfer ownership first - not implemented).
 * @param userId The ID of the user leaving the group.
 * @throws Error if the user is not in a group, or if an owner tries to leave with other members present.
 */
export async function leaveFinalGroup(userId: string): Promise<void> {
  const userMembership = await db.query.finalGroupMembers.findFirst({
    where: eq(finalGroupMembers.userId, userId),
    with: {
      group: {
        // Assuming a 'group' relation exists on finalGroupMembers to finalGroups
        with: {
          members: true, // To count members
        },
      },
    },
  });

  if (!userMembership) {
    throw new Error("User is not in a final project group.");
  }

  const { groupId, role } = userMembership;
  const groupMembers = await db.query.finalGroupMembers.findMany({
    where: eq(finalGroupMembers.groupId, groupId),
  });

  if (role === "owner") {
    if (groupMembers.length > 1) {
      throw new Error(
        "Owner cannot leave the group while other members are present. Please transfer ownership first."
      );
    } else {
      // Owner is the last member, delete the membership then the group
      await db
        .delete(finalGroupMembers)
        .where(eq(finalGroupMembers.userId, userId));
      await db.delete(finalGroups).where(eq(finalGroups.id, groupId));
    }
  } else {
    // Non-owner member leaving
    await db
      .delete(finalGroupMembers)
      .where(eq(finalGroupMembers.userId, userId));
  }
}

/**
 * Allows a group owner to remove a member from their final project group.
 * @param groupId The ID of the group.
 * @param memberUserIdToRemove The ID of the member to remove.
 * @param currentUserId The ID of the user attempting the removal (must be owner).
 * @returns The updated group details.
 * @throws Error if the current user is not the owner, or trying to remove themselves, or member not found.
 */
export async function removeMemberFromFinalGroup(
  groupId: string,
  memberUserIdToRemove: string,
  currentUserId: string
): Promise<FinalGroupWithDetails> {
  // Verify current user is owner
  const M_ownerMembership = await db.query.finalGroupMembers.findFirst({
    where: and(
      eq(finalGroupMembers.groupId, groupId),
      eq(finalGroupMembers.userId, currentUserId),
      eq(finalGroupMembers.role, "owner")
    ),
  });

  if (!M_ownerMembership) {
    throw new Error("Unauthorized: Only group owner can remove members.");
  }

  // Owner cannot remove themselves with this function
  if (memberUserIdToRemove === currentUserId) {
    throw new Error(
      "Owner cannot remove themselves. Use 'Leave Group' functionality."
    );
  }

  // Check if member to remove exists in the group
  const memberToRemove = await db.query.finalGroupMembers.findFirst({
    where: and(
      eq(finalGroupMembers.groupId, groupId),
      eq(finalGroupMembers.userId, memberUserIdToRemove)
    ),
  });

  if (!memberToRemove) {
    throw new Error("Member not found in this group.");
  }

  // Remove the member
  await db
    .delete(finalGroupMembers)
    .where(
      and(
        eq(finalGroupMembers.groupId, groupId),
        eq(finalGroupMembers.userId, memberUserIdToRemove)
      )
    );

  // Fetch and return the updated group details (similar to joinFinalGroup's return)
  const updatedGroupDetails = await db.query.finalGroups.findFirst({
    where: eq(finalGroups.id, groupId),
    with: {
      selectedProject: {
        columns: { id: true, title: true, category: true },
      },
      members: {
        columns: { role: true, joinedAt: true },
        with: {
          user: {
            columns: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  if (
    !updatedGroupDetails ||
    !updatedGroupDetails.members ||
    updatedGroupDetails.members.length === 0
  ) {
    // This could happen if the owner removed the last other member.
    // The group still exists, but owner is the only one.
    // If group becomes empty and owner also left (via leaveGroup), it's deleted there.
    // It might be valid for a group to have only an owner.
    const ownerProfileData = await db.query.profiles.findFirst({
      where: eq(profiles.id, currentUserId),
    });
    if (!ownerProfileData)
      throw new Error(
        "Failed to retrieve owner profile for group details after member removal."
      );

    const ownerAsMember: FinalGroupMemberWithProfile = {
      profile: {
        id: ownerProfileData.id,
        email: ownerProfileData.email,
        fullName: ownerProfileData.fullName,
        avatarUrl: ownerProfileData.avatarUrl,
      },
      role: "owner",
      joinedAt: M_ownerMembership.joinedAt, // Use owner's original join date
    };

    return {
      id: updatedGroupDetails?.id ?? groupId, // Fallback to groupId if updatedGroupDetails is null somehow
      name: updatedGroupDetails?.name ?? "Group Name Not Found",
      description: updatedGroupDetails?.description ?? null,
      selectedProject: updatedGroupDetails?.selectedProject ?? null,
      projectIdea: updatedGroupDetails?.projectIdea ?? null,
      repositoryUrl: updatedGroupDetails?.repositoryUrl ?? null,
      owner: ownerAsMember.profile,
      members: [ownerAsMember], // Only owner left
      createdAt: updatedGroupDetails?.createdAt ?? new Date().toISOString(),
      updatedAt: updatedGroupDetails?.updatedAt ?? new Date().toISOString(),
    };
  }

  const ownerMemberData = updatedGroupDetails.members.find(
    (m) => m.role === "owner"
  );
  if (!ownerMemberData || !ownerMemberData.user) {
    throw new Error(
      "Group found without an owner or owner profile after member removal."
    );
  }
  const ownerProfile = ownerMemberData.user;

  const mappedMembers: FinalGroupMemberWithProfile[] =
    updatedGroupDetails.members
      .filter((member) => member.user)
      .map((member) => ({
        profile: {
          id: member.user!.id,
          email: member.user!.email,
          fullName: member.user!.fullName,
          avatarUrl: member.user!.avatarUrl,
        },
        role: member.role as "owner" | "member",
        joinedAt: member.joinedAt,
      }));

  return {
    id: updatedGroupDetails.id,
    name: updatedGroupDetails.name,
    description: updatedGroupDetails.description,
    selectedProject: updatedGroupDetails.selectedProject
      ? {
          id: updatedGroupDetails.selectedProject.id,
          title: updatedGroupDetails.selectedProject.title,
          category: updatedGroupDetails.selectedProject.category,
        }
      : null,
    projectIdea: updatedGroupDetails.projectIdea,
    repositoryUrl: updatedGroupDetails.repositoryUrl,
    owner: {
      id: ownerProfile.id,
      email: ownerProfile.email,
      fullName: ownerProfile.fullName,
      avatarUrl: ownerProfile.avatarUrl,
    },
    members: mappedMembers,
    createdAt: updatedGroupDetails.createdAt,
    updatedAt: updatedGroupDetails.updatedAt,
  };
}

/**
 * Fetches all final project groups with their details.
 * @returns A list of all final groups with their members, owner, and selected project.
 */
export async function getAllFinalGroupsWithDetails(): Promise<
  FinalGroupWithDetails[]
> {
  const allGroupsFromDb = await db.query.finalGroups.findMany({
    with: {
      selectedProject: {
        columns: { id: true, title: true, category: true },
      },
      members: {
        columns: { role: true, joinedAt: true }, // Columns from final_group_members
        with: {
          user: {
            // Relation from finalGroupMembers to profiles
            columns: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
    // TODO: Add ordering if needed, e.g., by creation date or name
    // orderBy: (finalGroups, { desc }) => [desc(finalGroups.createdAt)]
  });

  if (!allGroupsFromDb) {
    return []; // Should not happen with findMany unless DB error, but good for safety
  }

  const mappedGroups: FinalGroupWithDetails[] = allGroupsFromDb
    .map((group) => {
      if (!group.members || group.members.length === 0) {
        // This case should ideally not happen for a valid group, but handle defensively
        // It implies a group exists with no members, not even an owner, which is inconsistent.
        // Depending on strictness, could filter these out or log an error.
        // For now, let's assume if it exists, it should have an owner.
        // If not, the find for ownerMemberData will fail.
        console.warn(
          `Group ${group.id} has no members listed in query results.`
        );
        // We might need to decide if such a group should be returned or an error thrown/logged more formally.
        // For now, let's attempt to return it but owner/members will be problematic.
      }

      const ownerMemberData = group.members?.find((m) => m.role === "owner");

      // Default/fallback owner profile if not found (shouldn't happen for valid groups)
      const defaultOwnerProfile: ProfileDetails = {
        id: "unknown",
        email: "unknown",
        fullName: "Unknown Owner",
        avatarUrl: null,
      };
      const ownerProfile = ownerMemberData?.user
        ? {
            id: ownerMemberData.user.id,
            email: ownerMemberData.user.email,
            fullName: ownerMemberData.user.fullName,
            avatarUrl: ownerMemberData.user.avatarUrl,
          }
        : defaultOwnerProfile;

      if (!ownerMemberData || !ownerMemberData.user) {
        console.warn(
          `Group ${group.id} is missing a valid owner or owner profile.`
        );
      }

      const mappedMembers: FinalGroupMemberWithProfile[] =
        group.members
          ?.filter((member) => member.user)
          .map((member) => ({
            profile: {
              id: member.user!.id,
              email: member.user!.email,
              fullName: member.user!.fullName,
              avatarUrl: member.user!.avatarUrl,
            },
            role: member.role as "owner" | "member",
            joinedAt: member.joinedAt,
          })) || [];

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        selectedProject: group.selectedProject
          ? {
              id: group.selectedProject.id,
              title: group.selectedProject.title,
              category: group.selectedProject.category,
            }
          : null,
        projectIdea: group.projectIdea,
        repositoryUrl: group.repositoryUrl,
        owner: ownerProfile, // Use the resolved or default owner profile
        members: mappedMembers,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      };
    })
    .filter((group) => group.members.some((m) => m.role === "owner")); // Ensure only groups with a valid owner are returned

  return mappedGroups;
}

/**
 * Allows a group owner to select a final project for their group.
 * @param groupId The ID of the group.
 * @param projectId The ID of the project to select.
 * @param userId The ID of the user attempting the action (must be group owner).
 * @returns The updated group details with the selected project.
 * @throws Error if user is not owner, group/project not found, or update fails.
 */
export async function selectProjectForFinalGroup(
  groupId: string,
  projectId: string,
  userId: string
): Promise<FinalGroupWithDetails> {
  // 1. Verify user is the owner of the group
  const groupMembership = await db.query.finalGroupMembers.findFirst({
    where: and(
      eq(finalGroupMembers.groupId, groupId),
      eq(finalGroupMembers.userId, userId),
      eq(finalGroupMembers.role, "owner")
    ),
  });

  if (!groupMembership) {
    throw new Error(
      "Unauthorized: User is not the owner of this group or group not found."
    );
  }

  // 2. Verify the project exists
  const projectExists = await db.query.finalProjects.findFirst({
    where: eq(finalProjects.id, projectId),
    columns: { id: true }, // Only need to check for existence
  });

  if (!projectExists) {
    throw new Error("Project not found.");
  }

  // 3. Update the group with the selected project ID
  const [updatedGroupRaw] = await db
    .update(finalGroups)
    .set({ selectedProjectId: projectId, updatedAt: new Date().toISOString() })
    .where(eq(finalGroups.id, groupId))
    .returning();

  if (!updatedGroupRaw) {
    throw new Error("Failed to update group with selected project.");
  }

  // 4. Fetch and return the complete group details (similar to other service functions)
  // This ensures the returned data is consistent and includes the populated project details
  const updatedGroupDetails = await db.query.finalGroups.findFirst({
    where: eq(finalGroups.id, groupId),
    with: {
      selectedProject: {
        columns: { id: true, title: true, category: true },
      },
      members: {
        columns: { role: true, joinedAt: true },
        with: {
          user: {
            columns: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  if (
    !updatedGroupDetails ||
    !updatedGroupDetails.members ||
    updatedGroupDetails.members.length === 0
  ) {
    // This should not happen if the update was successful and group exists
    throw new Error(
      "Failed to retrieve updated group details after project selection."
    );
  }

  const ownerMemberData = updatedGroupDetails.members.find(
    (m) => m.role === "owner"
  );
  if (!ownerMemberData || !ownerMemberData.user) {
    throw new Error(
      "Group is missing a valid owner or owner profile after project selection."
    );
  }
  const ownerProfile = ownerMemberData.user;

  const mappedMembers: FinalGroupMemberWithProfile[] =
    updatedGroupDetails.members
      .filter((member) => member.user)
      .map((member) => ({
        profile: {
          id: member.user!.id,
          email: member.user!.email,
          fullName: member.user!.fullName,
          avatarUrl: member.user!.avatarUrl,
        },
        role: member.role as "owner" | "member",
        joinedAt: member.joinedAt,
      }));

  return {
    id: updatedGroupDetails.id,
    name: updatedGroupDetails.name,
    description: updatedGroupDetails.description,
    selectedProject: updatedGroupDetails.selectedProject
      ? {
          id: updatedGroupDetails.selectedProject.id,
          title: updatedGroupDetails.selectedProject.title,
          category: updatedGroupDetails.selectedProject.category,
        }
      : null,
    projectIdea: updatedGroupDetails.projectIdea,
    repositoryUrl: updatedGroupDetails.repositoryUrl,
    owner: {
      id: ownerProfile.id,
      email: ownerProfile.email,
      fullName: ownerProfile.fullName,
      avatarUrl: ownerProfile.avatarUrl,
    },
    members: mappedMembers,
    createdAt: updatedGroupDetails.createdAt,
    updatedAt: updatedGroupDetails.updatedAt,
  };
}

/**
 * Allows a group owner to update the project idea markdown for their group.
 * @param groupId The ID of the group.
 * @param projectIdea The markdown content for the project idea.
 * @param userId The ID of the user attempting the action (must be group owner).
 * @returns The updated group details with the new project idea.
 * @throws Error if user is not owner, group not found, or update fails.
 */
export async function updateProjectIdea(
  groupId: string,
  projectIdea: string,
  userId: string
): Promise<FinalGroupWithDetails> {
  // 1. Verify user is the owner of the group
  const groupMembership = await db.query.finalGroupMembers.findFirst({
    where: and(
      eq(finalGroupMembers.groupId, groupId),
      eq(finalGroupMembers.userId, userId),
      eq(finalGroupMembers.role, "owner")
    ),
  });

  if (!groupMembership) {
    throw new Error(
      "Unauthorized: User is not the owner of this group or group not found."
    );
  }

  // 2. Update the group with the project idea
  const [updatedGroupRaw] = await db
    .update(finalGroups)
    .set({ projectIdea: projectIdea, updatedAt: new Date().toISOString() })
    .where(eq(finalGroups.id, groupId))
    .returning();

  if (!updatedGroupRaw) {
    throw new Error("Failed to update group with project idea.");
  }

  // 3. Fetch and return the complete group details
  const updatedGroupDetails = await db.query.finalGroups.findFirst({
    where: eq(finalGroups.id, groupId),
    with: {
      selectedProject: {
        columns: { id: true, title: true, category: true },
      },
      members: {
        columns: { role: true, joinedAt: true },
        with: {
          user: {
            columns: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  if (
    !updatedGroupDetails ||
    !updatedGroupDetails.members ||
    updatedGroupDetails.members.length === 0
  ) {
    throw new Error(
      "Failed to retrieve updated group details after project idea update."
    );
  }

  const ownerMemberData = updatedGroupDetails.members.find(
    (m) => m.role === "owner"
  );
  if (!ownerMemberData || !ownerMemberData.user) {
    throw new Error(
      "Group is missing a valid owner or owner profile after project idea update."
    );
  }
  const ownerProfile = ownerMemberData.user;

  const mappedMembers: FinalGroupMemberWithProfile[] =
    updatedGroupDetails.members
      .filter((member) => member.user)
      .map((member) => ({
        profile: {
          id: member.user!.id,
          email: member.user!.email,
          fullName: member.user!.fullName,
          avatarUrl: member.user!.avatarUrl,
        },
        role: member.role as "owner" | "member",
        joinedAt: member.joinedAt,
      }));

  return {
    id: updatedGroupDetails.id,
    name: updatedGroupDetails.name,
    description: updatedGroupDetails.description,
    selectedProject: updatedGroupDetails.selectedProject
      ? {
          id: updatedGroupDetails.selectedProject.id,
          title: updatedGroupDetails.selectedProject.title,
          category: updatedGroupDetails.selectedProject.category,
        }
      : null,
    projectIdea: updatedGroupDetails.projectIdea,
    repositoryUrl: updatedGroupDetails.repositoryUrl,
    owner: {
      id: ownerProfile.id,
      email: ownerProfile.email,
      fullName: ownerProfile.fullName,
      avatarUrl: ownerProfile.avatarUrl,
    },
    members: mappedMembers,
    createdAt: updatedGroupDetails.createdAt,
    updatedAt: updatedGroupDetails.updatedAt,
  };
}
