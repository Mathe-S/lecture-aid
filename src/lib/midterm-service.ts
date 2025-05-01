import db from "@/db";
import { eq, and, sql, inArray } from "drizzle-orm";
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
  MemberWithProfileAndEvaluationStatus,
  MidtermEvaluationWithGroup,
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
 * Get all midterm groups with their members AND task progress AND evaluation status (OPTIMIZED)
 */
export async function getMidtermGroupsWithProgress(): Promise<
  MidtermGroupWithProgress[]
> {
  // 1. Fetch all base groups
  const groups = await db
    .select()
    .from(midtermGroups)
    .orderBy(midtermGroups.createdAt);

  if (groups.length === 0) {
    return [];
  }

  const groupIds = groups.map((g) => g.id);

  // 2. Fetch all relevant members and their profiles
  const allMembersWithProfiles = await db
    .select({
      id: midtermGroupMembers.id,
      groupId: midtermGroupMembers.groupId,
      userId: midtermGroupMembers.userId,
      role: midtermGroupMembers.role,
      joinedAt: midtermGroupMembers.joinedAt,
      profile: profiles,
    })
    .from(midtermGroupMembers)
    .innerJoin(profiles, eq(midtermGroupMembers.userId, profiles.id))
    .where(inArray(midtermGroupMembers.groupId, groupIds));

  // 3. Fetch all task counts grouped by groupId
  const allTaskCounts = await db
    .select({
      groupId: midtermTasks.groupId,
      total: sql<number>`count(*)`.mapWith(Number).as("total_tasks"),
      checked:
        sql<number>`count(*) filter (where ${midtermTasks.isChecked} = true)`
          .mapWith(Number)
          .as("checked_tasks"),
    })
    .from(midtermTasks)
    .where(inArray(midtermTasks.groupId, groupIds))
    .groupBy(midtermTasks.groupId);

  // 4. Fetch existing evaluation markers (groupId, userId pairs)
  const existingEvaluations = await db
    .select({
      groupId: midtermEvaluations.groupId,
      userId: midtermEvaluations.userId,
    })
    .from(midtermEvaluations)
    .where(inArray(midtermEvaluations.groupId, groupIds));

  // Create a Set for quick lookup of evaluated user-group pairs
  const evaluatedSet = new Set(
    existingEvaluations.map((e) => `${e.groupId}-${e.userId}`)
  );

  // 5. Combine the data efficiently using Maps
  const membersByGroupId = new Map<
    string,
    MemberWithProfileAndEvaluationStatus[]
  >();
  allMembersWithProfiles.forEach((m) => {
    const isEvaluated = evaluatedSet.has(`${m.groupId}-${m.userId}`);

    const processedMember: MemberWithProfileAndEvaluationStatus = {
      id: m.id,
      groupId: m.groupId,
      userId: m.userId,
      role: m.role as "owner" | "member",
      joinedAt: m.joinedAt,
      profile: m.profile,
      isEvaluated: isEvaluated,
    };

    const existing = membersByGroupId.get(m.groupId) || [];
    existing.push(processedMember);
    membersByGroupId.set(m.groupId, existing);
  });

  // Map task counts to their groupId
  const taskCountsByGroupId = new Map<
    string,
    { total: number; checked: number }
  >();
  allTaskCounts.forEach((tc) => {
    taskCountsByGroupId.set(tc.groupId, {
      total: tc.total || 0,
      checked: tc.checked || 0,
    });
  });

  // 6. Construct the final result array
  const results: MidtermGroupWithProgress[] = groups.map((group) => {
    const members = membersByGroupId.get(group.id) || [];
    const taskProgress = taskCountsByGroupId.get(group.id);

    return {
      ...group,
      members: members,
      taskProgress: taskProgress,
    };
  });

  return results;
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
  const group = await getMidtermGroupById(groupId);

  if (!group || !group.repositoryOwner || !group.repositoryName) {
    throw new Error("Group not found or repository not connected.");
  }

  // --- Initialize Octokit --- //
  const tokenToUse = githubToken || process.env.GITHUB_TOKEN || null;
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

    // 4. Commit Activity Stats (Weekly Commits) - WITH STATUS LOGGING AND BASIC RETRY

    let weeklyCommitStats: { week: number; total: number; days: number[] }[] =
      [];
    let commitActivityResponseStatus: number | undefined;
    let finalCommitActivityData: any = null;
    try {
      let commitActivityResponse = await octokit.repos.getCommitActivityStats({
        owner: owner,
        repo: repo,
      });
      commitActivityResponseStatus = commitActivityResponse.status;

      if (commitActivityResponseStatus === 202) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        commitActivityResponse = await octokit.repos.getCommitActivityStats({
          owner: owner,
          repo: repo,
        });
        commitActivityResponseStatus = commitActivityResponse.status;
      }
      finalCommitActivityData = commitActivityResponse.data; // Store data regardless of final status for logging

      // Process data based on final status
      if (
        commitActivityResponseStatus === 200 &&
        Array.isArray(finalCommitActivityData)
      ) {
        weeklyCommitStats = finalCommitActivityData;
      } else if (commitActivityResponseStatus === 204) {
        console.log(
          `[Sync ${groupId}] Commit activity stats returned no content (204).`
        );
      } else if (commitActivityResponseStatus === 202) {
        console.warn(
          `[Sync ${groupId}] Commit activity stats still computing after retry (202).`
        );
      } else {
        // Handle other statuses (e.g., 403, 404, 422, 500)
        console.warn(
          `[Sync ${groupId}] Could not fetch commit activity stats. Final Status: ${commitActivityResponseStatus}, Data:`,
          finalCommitActivityData
        );
      }
    } catch (error: any) {
      console.error(
        `[Sync ${groupId}] Error fetching commit activity stats: ${error.message}`,
        error
      );
    }

    // 5. Code Frequency Stats (Weekly Add/Del) - Fetching it simply for now
    let weeklyCodeFrequency: [number, number, number][] = []; // Expected: [timestamp, additions, deletions]
    let codeFrequencyResponseStatus: number | undefined;
    let finalCodeFrequencyData: any = null;
    try {
      // Note: This might also return 202/204
      const codeFrequencyResponse = await octokit.repos.getCodeFrequencyStats({
        owner: group.repositoryOwner,
        repo: group.repositoryName,
      });
      codeFrequencyResponseStatus = codeFrequencyResponse.status;
      finalCodeFrequencyData = codeFrequencyResponse.data;

      if (
        codeFrequencyResponseStatus === 200 &&
        Array.isArray(finalCodeFrequencyData)
      ) {
        const validatedData = finalCodeFrequencyData.filter(
          (item: unknown): item is [number, number, number] =>
            Array.isArray(item) &&
            item.length === 3 &&
            item.every((n) => typeof n === "number")
        );
        weeklyCodeFrequency = validatedData;
      } else if (codeFrequencyResponseStatus === 204) {
        console.log(
          `[Sync ${groupId}] Code frequency stats returned no content (204).`
        );
      } else if (codeFrequencyResponseStatus === 202) {
        console.warn(
          `[Sync ${groupId}] Code frequency stats are computing (202). Data might be incomplete this cycle.`
        );
      } else {
        console.warn(
          `[Sync ${groupId}] Could not fetch code frequency stats. Status: ${codeFrequencyResponseStatus}, Data:`,
          finalCodeFrequencyData
        );
      }
    } catch (error: any) {
      console.error(
        `[Sync ${groupId}] Error fetching code frequency stats: ${error.message}`,
        error
      );
    }

    // 6. Contributors
    let contributors: any[] = [];
    try {
      const { data: contributorStats } = await octokit.repos.listContributors({
        owner: owner,
        repo: repo,
      });
      contributors = contributorStats;
    } catch (err) {
      console.error(`[Sync ${groupId}] Error fetching contributors:`, err);
    }

    // 7. Languages
    let languages: Record<string, number> = {};
    try {
      const { data: langData } = await octokit.repos.listLanguages({
        owner: group.repositoryOwner,
        repo: group.repositoryName,
      });
      languages = langData;
    } catch (err) {
      console.error(`[Sync ${groupId}] Error fetching languages:`, err);
    }

    // --- Process Data --- //

    // Create Maps for weekly data aggregation
    const weeklyDataMap = new Map<
      number,
      { commits: number; additions: number; deletions: number }
    >();

    // Process Commit Activity (using the fetched weeklyCommitStats)
    weeklyCommitStats.forEach((weekStat) => {
      const weekTimestamp = weekStat.week;
      if (!weeklyDataMap.has(weekTimestamp)) {
        weeklyDataMap.set(weekTimestamp, {
          commits: 0,
          additions: 0,
          deletions: 0,
        });
      }
      weeklyDataMap.get(weekTimestamp)!.commits = weekStat.total;
    });

    // Process Code Frequency (using the fetched weeklyCodeFrequency)
    weeklyCodeFrequency.forEach(([weekTimestamp, additions, deletions]) => {
      if (!weeklyDataMap.has(weekTimestamp)) {
        weeklyDataMap.set(weekTimestamp, {
          commits: 0,
          additions: 0,
          deletions: 0,
        });
      }
      const weekData = weeklyDataMap.get(weekTimestamp)!;
      weekData.additions = additions;
      weekData.deletions = Math.abs(deletions); // Deletions are negative
    });

    // Convert Map to Timeline Array
    const weeklyTimeline = Array.from(weeklyDataMap.entries())
      .map(([timestamp, data]) => ({
        date: new Date(timestamp * 1000).toISOString().split("T")[0],
        commits: data.commits,
        additions: data.additions,
        deletions: data.deletions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate overall additions/deletions from the merged timeline
    let totalAdditions = 0;
    let totalDeletions = 0;
    weeklyTimeline.forEach((week) => {
      totalAdditions += week.additions;
      totalDeletions += week.deletions;
    });

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
      codeAdditions: totalAdditions,
      codeDeletions: totalDeletions,
      contributorsCount: contributors.length,
      detailedMetrics: {
        commitsByAuthor,
        prsByAuthor,
        openPRs,
        closedPRs,
        mergedPRs,
        branchNames: allBranches.map((b) => b.name),
        languages,
        weeklyTimeline: weeklyTimeline, // Store the combined timeline
      },
    };

    // --- Update Contributions --- //
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
          const [foundProfile] = await db
            .select()
            .from(profiles)
            .where(eq(profiles.email, contributorEmail))
            .limit(1);
          if (foundProfile) profile = foundProfile;
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

    // --- Update Database --- //
    await updateRepositoryMetrics(groupId, calculatedMetrics);
    await updateLastSync(groupId);

    return true;
  } catch (error) {
    throw error;
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

/**
 * Get evaluations for a specific user, including the group name.
 */
export async function getMidtermEvaluationsForUser(
  userId: string
): Promise<MidtermEvaluationWithGroup[]> {
  const results = await db
    .select({
      evaluation: midtermEvaluations,
      groupName: midtermGroups.name,
    })
    .from(midtermEvaluations)
    .where(eq(midtermEvaluations.userId, userId))
    .innerJoin(midtermGroups, eq(midtermEvaluations.groupId, midtermGroups.id));

  return results.map((r) => ({
    ...r.evaluation,
    groupName: r.groupName,
  }));
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
