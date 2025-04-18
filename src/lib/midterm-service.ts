import db from "@/db";
import { eq, and, sql } from "drizzle-orm";
import {
  midtermGroups,
  midtermGroupMembers,
  midtermRepositoryMetrics,
  midtermContributions,
  midtermEvaluations,
  MidtermGroup,
  MidtermGroupWithMembers,
  MidtermGroupWithDetails,
  MidtermGroupWithProgress,
  MidtermContribution,
  MidtermEvaluation,
  midtermTasks,
  MidtermTask,
} from "@/db/drizzle/midterm-schema";
import { profiles, Profile } from "@/db/drizzle/schema";
import { Octokit } from "@octokit/rest";

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
 * Parses TODO markdown into structured tasks.
 * Forgivingly handles lines starting with #, ##, or - [ ]
 */
interface ParsedTask {
  phase: string;
  step: string;
  taskText: string;
  isChecked: boolean;
}
function parseTodoMarkdown(markdown: string): ParsedTask[] {
  const lines = markdown.split("\n");
  const tasks: ParsedTask[] = [];
  let currentPhase = "Phase Unknown";
  let currentStep = "Step Unknown";

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    const phaseMatch = trimmedLine.match(/^#\s+(.*)/);
    if (phaseMatch) {
      currentPhase = phaseMatch[1].trim() || "Phase Unknown";
      currentStep = "Step Unknown"; // Reset step when phase changes
      return; // Move to next line
    }

    const stepMatch = trimmedLine.match(/^##\s+(.*)/);
    if (stepMatch) {
      currentStep = stepMatch[1].trim() || "Step Unknown";
      return; // Move to next line
    }

    const taskMatch = trimmedLine.match(/^-\s+\[([x ])\]\s+(.*)/i);
    if (taskMatch) {
      tasks.push({
        phase: currentPhase,
        step: currentStep,
        isChecked: taskMatch[1].toLowerCase() === "x",
        taskText: taskMatch[2].trim() || "Untitled Task",
      });
    }
  });

  return tasks;
}

/**
 * Replaces all tasks for a group with a new set.
 */
async function replaceGroupTasks(
  groupId: string,
  tasks: ParsedTask[]
): Promise<void> {
  // Use a transaction to ensure atomicity
  await db.transaction(async (tx) => {
    // Delete existing tasks
    await tx.delete(midtermTasks).where(eq(midtermTasks.groupId, groupId));

    // Insert new tasks if any
    if (tasks.length > 0) {
      const tasksToInsert = tasks.map((task, index) => ({
        groupId,
        phase: task.phase,
        step: task.step,
        taskText: task.taskText,
        isChecked: task.isChecked,
        orderIndex: index, // Use array index for ordering
      }));
      await tx.insert(midtermTasks).values(tasksToInsert);
    }
  });
}

/**
 * Updates the checked status of a single task.
 */
async function updateTaskStatus(
  taskId: string,
  isChecked: boolean
): Promise<MidtermTask | null> {
  const [updatedTask] = await db
    .update(midtermTasks)
    .set({
      isChecked,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(midtermTasks.id, taskId))
    .returning();

  return updatedTask || null;
}

/**
 * Gets a single task by its ID.
 */
async function getTaskById(taskId: string): Promise<MidtermTask | null> {
  const [task] = await db
    .select()
    .from(midtermTasks)
    .where(eq(midtermTasks.id, taskId));
  return task || null;
}

/**
 * Gets all tasks for a specific group, ordered.
 */
async function getTasksByGroupId(groupId: string): Promise<MidtermTask[]> {
  return db
    .select()
    .from(midtermTasks)
    .where(eq(midtermTasks.groupId, groupId))
    .orderBy(midtermTasks.orderIndex);
}

/**
 * Checks if a user is the owner of a group.
 */
async function isGroupOwner(groupId: string, userId: string): Promise<boolean> {
  const [member] = await db
    .select()
    .from(midtermGroupMembers)
    .where(
      and(
        eq(midtermGroupMembers.groupId, groupId),
        eq(midtermGroupMembers.userId, userId),
        eq(midtermGroupMembers.role, "owner")
      )
    );
  return !!member;
}

/**
 * Get all midterm groups with their members AND task progress
 */
export async function getMidtermGroupsWithProgress(): Promise<
  MidtermGroupWithProgress[]
> {
  const groups = await db
    .select()
    .from(midtermGroups)
    .orderBy(midtermGroups.createdAt);

  const groupsWithDetails: MidtermGroupWithProgress[] = [];

  for (const group of groups) {
    // Get members
    const members = await db
      .select()
      .from(midtermGroupMembers)
      .where(eq(midtermGroupMembers.groupId, group.id))
      .innerJoin(profiles, eq(midtermGroupMembers.userId, profiles.id));

    // Get task counts
    const taskCounts = await db
      .select({
        total: sql<number>`count(*)`.mapWith(Number),
        checked: sql<number>`count(*) filter (where is_checked = true)`.mapWith(
          Number
        ),
      })
      .from(midtermTasks)
      .where(eq(midtermTasks.groupId, group.id));

    groupsWithDetails.push({
      ...group,
      members: members.map((m) => ({
        ...m.midterm_group_members,
        profile: m.profiles,
      })),
      taskProgress: taskCounts[0] || { total: 0, checked: 0 },
    });
  }

  return groupsWithDetails;
}

/**
 * Get a specific midterm group with all its details including tasks
 */
export async function getMidtermGroupDetailsWithTasks(
  groupId: string
): Promise<MidtermGroupWithDetails | null> {
  const groupDetails = await getMidtermGroupDetails(groupId);

  if (!groupDetails) {
    return null;
  }

  // Get tasks
  const tasks = await getTasksByGroupId(groupId);

  return {
    ...groupDetails,
    tasks,
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
    metrics: metrics || null,
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
 * Leave an existing midterm group
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
  repositoryUrl: string
): Promise<void> {
  // Parse GitHub repository URL to get owner and repo name
  const urlParts = repositoryUrl.match(/github\.com\/([^/]+)\/([^/]+)$/);
  if (!urlParts || urlParts.length < 3) {
    throw new Error("Invalid GitHub repository URL format");
  }
  const repositoryOwner = urlParts[1];
  const repositoryName = urlParts[2];

  // Update the group with repository details ONLY
  await db
    .update(midtermGroups)
    .set({
      repositoryUrl,
      repositoryOwner,
      repositoryName,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(midtermGroups.id, groupId));

  // Syncing is handled separately by specific API routes
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
  const result = await db
    .update(midtermGroups)
    .set({
      lastSync: new Date().toISOString(),
    })
    .where(eq(midtermGroups.id, groupId))
    .returning({ id: midtermGroups.id });

  return result.length > 0;
}

/**
 * Fetches data from GitHub and updates metrics
 */
export async function syncGitHubRepositoryData(
  groupId: string,
  githubToken?: string | null // Add optional token parameter
): Promise<boolean> {
  console.log(`Starting sync for group ${groupId}`);
  const group = await getMidtermGroupById(groupId);

  if (!group || !group.repositoryOwner || !group.repositoryName) {
    console.error(`Group ${groupId} not found or repository not connected.`);
    throw new Error("Group not found or repository not connected.");
  }

  // --- Initialize Octokit --- //
  const tokenToUse = githubToken || process.env.GITHUB_TOKEN || null;
  if (!tokenToUse) {
    console.warn(
      `No GitHub token found for sync (user provider_token or GITHUB_TOKEN env var). Proceeding with unauthenticated requests (rate limited).`
    );
  }
  const octokit = new Octokit({ auth: tokenToUse });
  const owner = group.repositoryOwner;
  const repo = group.repositoryName;

  try {
    // --- Fetch Data --- //
    console.log(`Fetching data for ${owner}/${repo}...`);

    // 1. Commits (Paginated)
    let allCommits: any[] = [];
    try {
      allCommits = await octokit.paginate(octokit.repos.listCommits, {
        owner,
        repo,
        per_page: 100,
      });
    } catch (err) {
      console.error(`Error fetching commits for ${owner}/${repo}:`, err);
      // Decide if this is a fatal error or if we can continue
      // throw err; // Option: Stop sync if commits fail
    }

    // 2. Pull Requests (Paginated)
    let allPRs: any[] = [];
    try {
      allPRs = await octokit.paginate(octokit.pulls.list, {
        owner,
        repo,
        state: "all", // Get open, closed, and merged
        per_page: 100,
      });
    } catch (err) {
      console.error(`Error fetching PRs for ${owner}/${repo}:`, err);
      // Handle error as needed
    }

    // 3. Branches (Paginated)
    let allBranches: any[] = [];
    try {
      allBranches = await octokit.paginate(octokit.repos.listBranches, {
        owner,
        repo,
        per_page: 100,
      });
    } catch (err) {
      console.error(`Error fetching branches for ${owner}/${repo}:`, err);
      // Handle error as needed
    }

    // 4. Commit Activity Stats (for additions/deletions)
    let weeklyStats: any[] = [];
    let totalAdditions = 0;
    let totalDeletions = 0;
    try {
      const { data: activityData } = await octokit.repos.getCommitActivityStats(
        { owner, repo }
      );

      if (Array.isArray(activityData)) {
        weeklyStats = activityData;
        weeklyStats.forEach((week) => {
          // Ensure 'a' and 'd' are numbers, default to 0 if not
          const additions = Number.isFinite(week.a) ? week.a : 0;
          const deletions = Number.isFinite(week.d) ? week.d : 0;
          totalAdditions += additions;
          totalDeletions += deletions;
        });
        console.log(
          `[Sync ${groupId}] Commit activity stats processed: Additions=${totalAdditions}, Deletions=${totalDeletions}`
        );
      } else {
        console.warn(
          `[Sync ${groupId}] Commit activity stats not an array or being computed. Add/Del set to 0.`
        );
        totalAdditions = 0;
        totalDeletions = 0;
        weeklyStats = [];
      }
    } catch (err: any) {
      console.error(
        `[Sync ${groupId}] Error fetching commit activity stats. Add/Del set to 0. Error: ${err.message}`
      );
      totalAdditions = 0;
      totalDeletions = 0;
      weeklyStats = [];
    }

    // 4. Contributors
    let contributors: any[] = [];
    try {
      const { data: contributorStats } = await octokit.repos.listContributors({
        owner,
        repo,
        anon: "false", // Include anonymous contributions if needed?
      });
      contributors = contributorStats;
    } catch (err) {
      console.error(`Error fetching contributors for ${owner}/${repo}:`, err);
      // Handle error as needed
    }

    // 5. Languages
    let languages: Record<string, number> = {};
    try {
      const { data: langData } = await octokit.repos.listLanguages({
        owner,
        repo,
      });
      languages = langData;
      console.log(
        `[Sync ${groupId}] Languages fetched: ${Object.keys(languages).join(
          ", "
        )}`
      );
    } catch (err) {
      console.error(`Error fetching languages for ${owner}/${repo}:`, err);
      // Handle error as needed, languages will remain empty
    }

    // --- Process Data --- //
    console.log("Processing GitHub data...");

    // Commit aggregation
    const commitsByAuthor: Record<string, number> = {};
    allCommits.forEach((commit) => {
      const authorLogin = commit.author?.login || "unknown";
      commitsByAuthor[authorLogin] = (commitsByAuthor[authorLogin] || 0) + 1;
    });

    // PR aggregation
    const prsByAuthor: Record<string, number> = {};
    let openPRs = 0;
    let closedPRs = 0;
    let mergedPRs = 0;
    allPRs.forEach((pr) => {
      const authorLogin = pr.user?.login || "unknown";
      prsByAuthor[authorLogin] = (prsByAuthor[authorLogin] || 0) + 1;
      if (pr.state === "open") openPRs++;
      else if (pr.merged_at) mergedPRs++;
      else closedPRs++;
    });

    const calculatedMetrics = {
      totalCommits: allCommits.length,
      totalPullRequests: allPRs.length,
      totalBranches: allBranches.length,
      totalIssues: 0, // Issues need separate fetching if required
      codeAdditions: totalAdditions, // Use sum from commit activity
      codeDeletions: totalDeletions, // Use sum from commit activity
      contributorsCount: contributors.length,
      detailedMetrics: {
        commitsByAuthor,
        prsByAuthor,
        openPRs,
        closedPRs, // Includes merged and unmerged closed
        mergedPRs,
        branchNames: allBranches.map((b) => b.name),
        // Add more details as needed
        weeklyCommitActivity: weeklyStats.map((w) => ({
          week: w.week,
          additions: w.a,
          deletions: w.d,
          commits: w.c,
        })),
        languages, // Add fetched languages
      },
    };

    // --- Update Contributions --- //
    console.log(`[Sync ${groupId}] Attempting to update contributor links...`);
    for (const contributor of contributors) {
      if (!contributor.login) continue; // Skip if no login

      let profile: Profile | null = null;

      // Attempt to find user profile via commit email
      try {
        // Find the first commit by this contributor to get their email
        const commitWithEmail = allCommits.find(
          (c) =>
            c.author?.login === contributor.login && c.commit?.author?.email
        );

        if (commitWithEmail?.commit?.author?.email) {
          const contributorEmail = commitWithEmail.commit.author.email;
          console.log(
            `[Sync ${groupId}] Found email ${contributorEmail} for contributor ${contributor.login}`
          );
          const [foundProfile] = await db
            .select()
            .from(profiles)
            .where(eq(profiles.email, contributorEmail))
            .limit(1);
          if (foundProfile) {
            profile = foundProfile;
            console.log(
              `[Sync ${groupId}] Linked ${contributor.login} to profile ID ${profile.id} via email`
            );
          }
        }
      } catch (err) {
        console.error(
          `[Sync ${groupId}] Error looking up profile for ${contributor.login} by email:`,
          err
        );
      }

      if (profile) {
        // Find if this profile is a member of the current group
        const memberRecord = group.members.find(
          (m) => m.userId === profile?.id
        );
        if (memberRecord) {
          // Aggregate specific contributions for this user
          const userCommits = allCommits.filter(
            (c) => c.author?.login === contributor.login
          ).length;
          const userPRs = allPRs.filter(
            (pr) => pr.user?.login === contributor.login
          ).length;
          // Additions/Deletions per user from contributor stats
          let userAdditions = 0;
          let userDeletions = 0;
          if (contributor.weeks && Array.isArray(contributor.weeks)) {
            contributor.weeks.forEach((w: { a: number; d: number }) => {
              userAdditions += Number.isFinite(w.a) ? w.a : 0; // Ensure number
              userDeletions += Number.isFinite(w.d) ? w.d : 0; // Ensure number
            });
          }

          try {
            await updateContribution({
              groupId: groupId,
              userId: profile.id,
              githubUsername: contributor.login, // Store the GH username still
              commits: userCommits,
              pullRequests: userPRs,
              codeReviews: 0, // Needs separate fetching/logic
              additions: userAdditions,
              deletions: userDeletions,
              branchesCreated: 0, // Needs separate fetching/logic
              lastCommitDate: null, // TODO: Find last commit date for this user if needed
              contributionData: { weeks: contributor.weeks || [] }, // Store raw week data
            });
            console.log(
              `[Sync ${groupId}] Updated contribution record for profile ${profile.id} (${contributor.login})`
            );
          } catch (updateErr) {
            console.error(
              `[Sync ${groupId}] Error updating contribution for profile ${profile.id} (${contributor.login}):`,
              updateErr
            );
          }
        } else {
          console.warn(
            `[Sync ${groupId}] Contributor ${contributor.login} linked to profile ${profile.id} but is not a member of group ${groupId}.`
          );
        }
      } else {
        console.warn(
          `[Sync ${groupId}] GitHub contributor ${contributor.login} could not be linked to a profile via commit email.`
        );
      }
    }
    console.log(`[Sync ${groupId}] Finished contributor link update attempts.`);

    // --- Update Database --- //
    console.log(
      `[Sync ${groupId}] Updating DB metrics: Commits=${calculatedMetrics.totalCommits}, Add=${calculatedMetrics.codeAdditions}, Del=${calculatedMetrics.codeDeletions}`
    );
    await updateRepositoryMetrics(groupId, calculatedMetrics);
    await updateLastSync(groupId);

    console.log(`[Sync ${groupId}] Sync successful.`);
    return true;
  } catch (error) {
    console.error(`Error during GitHub sync for group ${groupId}:`, error);
    // Optionally update the group status to indicate sync failure
    throw error; // Re-throw error to be caught by API route
  }
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

// --- Helper Functions Exported ---
export {
  parseTodoMarkdown,
  replaceGroupTasks,
  updateTaskStatus,
  getTaskById,
  getTasksByGroupId,
  isGroupOwner,
};
