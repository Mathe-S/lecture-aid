import db from "@/db";
import { eq, and, sql } from "drizzle-orm";
import {
  midtermGroups,
  midtermGroupMembers,
  midtermRepositoryMetrics,
  midtermContributions,
  midtermEvaluations,
  profiles,
  MidtermGroup,
  MidtermGroupWithMembers,
  MidtermGroupWithDetails,
  MidtermContribution,
  MidtermEvaluation,
  Profile,
} from "@/db/drizzle/schema";
import { Session } from "@supabase/supabase-js";

// Repository metrics shape for visualization
export interface RepositoryVisualizationData {
  name: string;
  description: string;
  url: string;
  commits: {
    count: number;
    byAuthor: Record<string, number>;
    timeline: { date: string; count: number }[];
  };
  branches: {
    count: number;
    names: string[];
    byCreator: Record<string, number>;
  };
  pullRequests: {
    count: number;
    open: number;
    closed: number;
    merged: number;
    byAuthor: Record<string, number>;
  };
  codebase: {
    additions: number;
    deletions: number;
    byLanguage?: Record<string, number>;
  };
  contributors: {
    count: number;
    data: {
      username: string;
      displayName?: string;
      contributions: number;
      avatar?: string;
    }[];
  };
  activity: {
    timeline: {
      date: string;
      commits: number;
      pullRequests: number;
      additions: number;
      deletions: number;
    }[];
  };
}

/**
 * Get all midterm groups with their members
 */
export async function getMidtermGroups(): Promise<MidtermGroupWithMembers[]> {
  const groups = await db
    .select()
    .from(midtermGroups)
    .orderBy(midtermGroups.createdAt);

  const groupsWithMembers: MidtermGroupWithMembers[] = [];

  for (const group of groups) {
    const members = await db
      .select()
      .from(midtermGroupMembers)
      .where(eq(midtermGroupMembers.groupId, group.id))
      .innerJoin(profiles, eq(midtermGroupMembers.userId, profiles.id));

    const formattedMembers = members.map((m) => ({
      ...m.midterm_group_members,
      profile: m.profiles,
    }));

    groupsWithMembers.push({
      ...group,
      members: formattedMembers,
    });
  }

  return groupsWithMembers;
}

/**
 * Get a specific midterm group with all its details
 */
export async function getMidtermGroupDetails(
  groupId: string
): Promise<MidtermGroupWithDetails | null> {
  const [group] = await db
    .select()
    .from(midtermGroups)
    .where(eq(midtermGroups.id, groupId));

  if (!group) {
    return null;
  }

  // Get members
  const members = await db
    .select()
    .from(midtermGroupMembers)
    .where(eq(midtermGroupMembers.groupId, groupId))
    .innerJoin(profiles, eq(midtermGroupMembers.userId, profiles.id));

  // Get repository metrics
  const [metrics] = await db
    .select()
    .from(midtermRepositoryMetrics)
    .where(eq(midtermRepositoryMetrics.groupId, groupId));

  // Get individual contributions
  const contributionsJoin = await db
    .select()
    .from(midtermContributions)
    .where(eq(midtermContributions.groupId, groupId))
    .innerJoin(profiles, eq(midtermContributions.userId, profiles.id));

  return {
    ...group,
    members: members.map(
      (m: { midterm_group_members: any; profiles: Profile }) => ({
        ...m.midterm_group_members,
        profile: m.profiles,
      })
    ),
    metrics: metrics || {
      id: "",
      groupId: groupId,
      totalCommits: 0,
      totalPullRequests: 0,
      totalBranches: 0,
      totalIssues: 0,
      codeAdditions: 0,
      codeDeletions: 0,
      contributorsCount: 0,
      lastUpdated: new Date().toISOString(),
      detailedMetrics: {},
    },
    contributions: contributionsJoin.map(
      (c: { midterm_contributions: any; profiles: Profile }) => ({
        ...c.midterm_contributions,
        profile: c.profiles,
      })
    ),
  };
}

/**
 * Alias for getMidtermGroupDetails to maintain compatibility
 */
export const getMidtermGroupById = getMidtermGroupDetails;

/**
 * Create a new midterm group
 */
export async function createMidtermGroup(
  name: string,
  description: string | null,
  creatorId: string
): Promise<MidtermGroup> {
  // Create the group
  const [group] = await db
    .insert(midtermGroups)
    .values({
      name,
      description,
    })
    .returning();

  // Add creator as a member with "owner" role
  await db.insert(midtermGroupMembers).values({
    groupId: group.id,
    userId: creatorId,
    role: "owner",
  });

  return group;
}

/**
 * Update a midterm group
 */
export async function updateMidtermGroup(
  id: string,
  groupData: Partial<MidtermGroup>
): Promise<MidtermGroup | null> {
  const [group] = await db
    .update(midtermGroups)
    .set({
      name: groupData.name,
      description: groupData.description,
      repositoryUrl: groupData.repositoryUrl,
      repositoryOwner: groupData.repositoryOwner,
      repositoryName: groupData.repositoryName,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(midtermGroups.id, id))
    .returning();

  return group || null;
}

/**
 * Delete a midterm group
 */
export async function deleteMidtermGroup(id: string): Promise<boolean> {
  await db.delete(midtermGroups).where(eq(midtermGroups.id, id));
  return true;
}

/**
 * Join an existing midterm group
 */
export async function joinMidtermGroup(
  groupId: string,
  userId: string
): Promise<boolean> {
  try {
    await db
      .insert(midtermGroupMembers)
      .values({
        groupId,
        userId,
        role: "member",
      })
      .onConflictDoNothing();

    return true;
  } catch (error) {
    console.error("Error joining group:", error);
    return false;
  }
}

/**
 * Leave a midterm group
 */
export async function leaveMidtermGroup(
  groupId: string,
  userId: string
): Promise<boolean> {
  try {
    await db
      .delete(midtermGroupMembers)
      .where(
        and(
          eq(midtermGroupMembers.groupId, groupId),
          eq(midtermGroupMembers.userId, userId)
        )
      );

    return true;
  } catch (error) {
    console.error("Error leaving group:", error);
    return false;
  }
}

/**
 * Update repository information for a group
 */
export async function updateRepositoryInfo(
  groupId: string,
  repoData: {
    repositoryUrl: string;
    repositoryOwner: string;
    repositoryName: string;
  }
): Promise<MidtermGroup | null> {
  const [group] = await db
    .update(midtermGroups)
    .set({
      repositoryUrl: repoData.repositoryUrl,
      repositoryOwner: repoData.repositoryOwner,
      repositoryName: repoData.repositoryName,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(midtermGroups.id, groupId))
    .returning();

  return group || null;
}

/**
 * Connect a GitHub repository to a midterm group
 */
export async function connectRepository(
  groupId: string,
  repositoryUrl: string,
  session: Session | null
): Promise<void> {
  if (!session?.provider_token) {
    throw new Error("No GitHub access token available");
  }

  // Parse GitHub repository URL to get owner and repo name
  // Format: https://github.com/owner/repo
  const urlParts = repositoryUrl.split("/");
  const repositoryOwner = urlParts[urlParts.length - 2];
  const repositoryName = urlParts[urlParts.length - 1];

  // Update the group with repository details
  await db
    .update(midtermGroups)
    .set({
      repositoryUrl,
      repositoryOwner,
      repositoryName,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(midtermGroups.id, groupId));

  // Trigger initial sync with the repository
  // Note: This functionality is now in github-service.ts
}

/**
 * Update repository metrics
 */
export async function updateRepositoryMetrics(
  groupId: string,
  metrics: {
    totalCommits: number;
    totalPullRequests: number;
    totalBranches: number;
    totalIssues: number;
    codeAdditions: number;
    codeDeletions: number;
    contributorsCount: number;
    detailedMetrics: Record<string, any>;
  }
): Promise<boolean> {
  await db
    .insert(midtermRepositoryMetrics)
    .values({
      groupId,
      totalCommits: metrics.totalCommits,
      totalPullRequests: metrics.totalPullRequests,
      totalBranches: metrics.totalBranches,
      totalIssues: metrics.totalIssues,
      codeAdditions: metrics.codeAdditions,
      codeDeletions: metrics.codeDeletions,
      contributorsCount: metrics.contributorsCount,
      lastUpdated: new Date().toISOString(),
      detailedMetrics: metrics.detailedMetrics,
    })
    .onConflictDoUpdate({
      target: [midtermRepositoryMetrics.groupId],
      set: {
        totalCommits: metrics.totalCommits,
        totalPullRequests: metrics.totalPullRequests,
        totalBranches: metrics.totalBranches,
        totalIssues: metrics.totalIssues,
        codeAdditions: metrics.codeAdditions,
        codeDeletions: metrics.codeDeletions,
        contributorsCount: metrics.contributorsCount,
        lastUpdated: new Date().toISOString(),
        detailedMetrics: metrics.detailedMetrics,
      },
    });

  return true;
}

/**
 * Update last sync timestamp for a group
 */
export async function updateLastSync(groupId: string): Promise<boolean> {
  await db
    .update(midtermGroups)
    .set({
      lastSync: new Date().toISOString(),
    })
    .where(eq(midtermGroups.id, groupId));

  return true;
}

/**
 * Update or create a user contribution record
 */
export async function updateContribution(
  contribution: Omit<MidtermContribution, "id" | "updatedAt">
): Promise<MidtermContribution | null> {
  const [result] = await db
    .insert(midtermContributions)
    .values({
      groupId: contribution.groupId,
      userId: contribution.userId,
      githubUsername: contribution.githubUsername,
      commits: contribution.commits,
      pullRequests: contribution.pullRequests,
      codeReviews: contribution.codeReviews,
      additions: contribution.additions,
      deletions: contribution.deletions,
      branchesCreated: contribution.branchesCreated,
      lastCommitDate: contribution.lastCommitDate,
      contributionData: contribution.contributionData,
    })
    .onConflictDoUpdate({
      target: [midtermContributions.groupId, midtermContributions.userId],
      set: {
        githubUsername: contribution.githubUsername,
        commits: contribution.commits,
        pullRequests: contribution.pullRequests,
        codeReviews: contribution.codeReviews,
        additions: contribution.additions,
        deletions: contribution.deletions,
        branchesCreated: contribution.branchesCreated,
        lastCommitDate: contribution.lastCommitDate,
        contributionData: contribution.contributionData,
        updatedAt: new Date().toISOString(),
      },
    })
    .returning();

  return result || null;
}

/**
 * Get contributions for a group
 */
export async function getContributionsByGroup(
  groupId: string
): Promise<MidtermContribution[]> {
  return await db
    .select()
    .from(midtermContributions)
    .where(eq(midtermContributions.groupId, groupId))
    .innerJoin(profiles, eq(midtermContributions.userId, profiles.id))
    .then((results) =>
      results.map((r) => ({
        ...r.midterm_contributions,
        profile: r.profiles,
      }))
    );
}

/**
 * Get contributions for a user
 */
export async function getContributionsByUser(
  userId: string
): Promise<MidtermContribution[]> {
  return await db
    .select()
    .from(midtermContributions)
    .where(eq(midtermContributions.userId, userId))
    .innerJoin(
      midtermGroups,
      eq(midtermContributions.groupId, midtermGroups.id)
    )
    .then((results) =>
      results.map((r) => ({
        ...r.midterm_contributions,
        group: r.midterm_groups,
      }))
    );
}

/**
 * Get evaluations for a user
 */
export async function getUserEvaluations(
  userId: string
): Promise<MidtermEvaluation[]> {
  return await db
    .select()
    .from(midtermEvaluations)
    .where(eq(midtermEvaluations.userId, userId));
}

/**
 * Get evaluations for a group
 */
export async function getGroupEvaluations(
  groupId: string
): Promise<MidtermEvaluation[]> {
  return await db
    .select()
    .from(midtermEvaluations)
    .where(eq(midtermEvaluations.groupId, groupId))
    .innerJoin(profiles, eq(midtermEvaluations.userId, profiles.id))
    .then((results) =>
      results.map((r) => ({
        ...r.midterm_evaluations,
        profile: r.profiles,
      }))
    );
}

/**
 * Create or update an evaluation
 */
export async function saveEvaluation(
  groupId: string,
  userId: string,
  evaluatorId: string,
  scores: {
    specScore: number;
    testScore: number;
    implementationScore: number;
    documentationScore: number;
    gitWorkflowScore: number;
  },
  feedback: string = ""
): Promise<void> {
  const totalScore =
    scores.specScore +
    scores.testScore +
    scores.implementationScore +
    scores.documentationScore +
    scores.gitWorkflowScore;

  await db
    .insert(midtermEvaluations)
    .values({
      groupId,
      userId,
      evaluatorId,
      specScore: scores.specScore,
      testScore: scores.testScore,
      implementationScore: scores.implementationScore,
      documentationScore: scores.documentationScore,
      gitWorkflowScore: scores.gitWorkflowScore,
      totalScore,
      feedback,
    })
    .onConflictDoUpdate({
      target: [midtermEvaluations.groupId, midtermEvaluations.userId],
      set: {
        specScore: scores.specScore,
        testScore: scores.testScore,
        implementationScore: scores.implementationScore,
        documentationScore: scores.documentationScore,
        gitWorkflowScore: scores.gitWorkflowScore,
        totalScore,
        feedback,
        updatedAt: new Date().toISOString(),
      },
    });
}

/**
 * Check if a user is a member of a midterm group
 */
export async function isGroupMember(
  groupId: string,
  userId: string
): Promise<boolean> {
  const memberCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(midtermGroupMembers)
    .where(
      and(
        eq(midtermGroupMembers.groupId, groupId),
        eq(midtermGroupMembers.userId, userId)
      )
    );

  return memberCount[0]?.count > 0;
}
