import { Session } from "@supabase/supabase-js";
import * as midtermService from "@/lib/midterm-service";

// GitHub API Types
export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  created_at: string;
  updated_at: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author: {
    login: string;
    id: number;
  } | null;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  user: {
    login: string;
    id: number;
  };
  created_at: string;
  updated_at: string;
  state: string;
  merged_at: string | null;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
}

export interface GitHubContributor {
  login: string;
  id: number;
  contributions: number;
}

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
 * Get user's GitHub repositories
 */
export async function getUserRepositories(
  session: Session | null
): Promise<GitHubRepo[]> {
  if (!session) {
    throw new Error("Not authenticated");
  }

  // Get GitHub token from session metadata
  const provider_token = session?.provider_token;

  if (!provider_token) {
    throw new Error("No GitHub access token found");
  }

  try {
    const response = await fetch(
      "https://api.github.com/user/repos?sort=updated&per_page=100",
      {
        headers: {
          Authorization: `Bearer ${provider_token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch repositories: ${response.statusText}`);
    }

    const repos: GitHubRepo[] = await response.json();

    // Filter only public repositories
    return repos.filter((repo) => !repo.private);
  } catch (error) {
    console.error("Error fetching GitHub repositories:", error);
    throw error;
  }
}

/**
 * Parse a GitHub repository URL to extract owner and name
 */
export function parseRepositoryUrl(repositoryUrl: string): {
  owner: string;
  name: string;
} {
  // Format: https://github.com/owner/repo
  const urlParts = repositoryUrl.split("/");
  const repositoryOwner = urlParts[urlParts.length - 2];
  const repositoryName = urlParts[urlParts.length - 1];

  return { owner: repositoryOwner, name: repositoryName };
}

/**
 * Connect a repository to a midterm group
 */
export async function connectRepository(
  groupId: string,
  repositoryUrl: string,
  session: Session | null
): Promise<boolean> {
  if (!session?.provider_token) {
    throw new Error("No GitHub access token available");
  }

  // Parse the repository URL
  const { owner, name } = parseRepositoryUrl(repositoryUrl);

  // Update the group with repository information
  await midtermService.updateRepositoryInfo(groupId, {
    repositoryUrl,
    repositoryOwner: owner,
    repositoryName: name,
  });

  // Trigger initial sync with the repository
  await syncRepositoryData(groupId, session);

  return true;
}

/**
 * Sync repository data from GitHub and store in database
 */
export async function syncRepositoryData(
  groupId: string,
  session: Session | null
): Promise<void> {
  if (!session?.provider_token) {
    throw new Error("No GitHub access token available");
  }

  // Get group data to access repository info
  const group = await midtermService.getMidtermGroupDetails(groupId);

  if (
    !group?.repositoryUrl ||
    !group.repositoryOwner ||
    !group.repositoryName
  ) {
    throw new Error("Repository information is incomplete");
  }

  const repoOwner = group.repositoryOwner;
  const repoName = group.repositoryName;
  const token = session.provider_token;

  // Fetch repository data from GitHub API
  const [commits, pullRequests, branches, contributors] = await Promise.all([
    fetchCommits(repoOwner, repoName, token),
    fetchPullRequests(repoOwner, repoName, token),
    fetchBranches(repoOwner, repoName, token),
    fetchContributors(repoOwner, repoName, token),
  ]);

  // Calculate metrics
  const totalCommits = commits.length;
  const totalPullRequests = pullRequests.length;
  const totalBranches = branches.length;
  const contributorsCount = contributors.length;

  let codeAdditions = 0;
  let codeDeletions = 0;

  // Fetch detailed stats for each commit
  for (const commit of commits) {
    if (!commit.stats) {
      const details = await fetchCommitDetails(
        repoOwner,
        repoName,
        commit.sha,
        token
      );
      if (details.stats) {
        codeAdditions += details.stats.additions;
        codeDeletions += details.stats.deletions;
      }
    } else {
      codeAdditions += commit.stats.additions;
      codeDeletions += commit.stats.deletions;
    }
  }

  // Create detailed metrics object for visualization
  const detailedMetrics = generateDetailedMetrics(
    commits,
    pullRequests,
    branches,
    contributors
  );

  // Store the metrics
  await midtermService.updateRepositoryMetrics(groupId, {
    totalCommits,
    totalPullRequests,
    totalBranches,
    totalIssues: 0, // GitHub API doesn't return issues by default
    codeAdditions,
    codeDeletions,
    contributorsCount,
    detailedMetrics,
  });

  // Process individual contributions
  await processContributions(groupId, commits, pullRequests, branches);

  // Update the last sync time
  await midtermService.updateLastSync(groupId);
}

/**
 * Process and store individual contributions
 */
async function processContributions(
  groupId: string,
  commits: GitHubCommit[],
  pullRequests: GitHubPullRequest[],
  branches: GitHubBranch[]
): Promise<void> {
  console.log(
    "Processing contributions for group:",
    branches,
    "now it simulates the API call"
  );
  // Get group members to match GitHub usernames/emails to users
  const group = await midtermService.getMidtermGroupDetails(groupId);
  if (!group) return;

  const members = group.members;

  // Map of GitHub usernames to user IDs
  const usernameToUserId = new Map<string, string>();
  const emailToUserId = new Map<string, string>();

  // Track contributions by GitHub username
  const contributionsByUsername: Record<
    string,
    {
      userId: string;
      commits: number;
      pullRequests: number;
      additions: number;
      deletions: number;
      branchesCreated: number;
      lastCommitDate: string | null;
    }
  > = {};

  // Initialize with known members
  for (const member of members) {
    const email = member.profile.email?.toLowerCase();
    if (email) {
      emailToUserId.set(email, member.userId);
    }
  }

  // Process commits
  for (const commit of commits) {
    const username = commit.author?.login || "unknown";
    let userId: string | undefined;

    // Try to match by email first
    const email = commit.commit.author.email.toLowerCase();
    if (emailToUserId.has(email)) {
      userId = emailToUserId.get(email);
    }

    // If we have a userId, ensure this username is mapped
    if (userId && username !== "unknown") {
      usernameToUserId.set(username, userId);
    }

    // Initialize contribution record if needed
    if (!contributionsByUsername[username]) {
      contributionsByUsername[username] = {
        userId: userId || "",
        commits: 0,
        pullRequests: 0,
        additions: 0,
        deletions: 0,
        branchesCreated: 0,
        lastCommitDate: null,
      };
    }

    // Update stats
    contributionsByUsername[username].commits += 1;
    if (commit.stats) {
      contributionsByUsername[username].additions += commit.stats.additions;
      contributionsByUsername[username].deletions += commit.stats.deletions;
    }

    // Update last commit date if newer
    const commitDate = new Date(commit.commit.author.date).toISOString();
    if (
      !contributionsByUsername[username].lastCommitDate ||
      commitDate > contributionsByUsername[username].lastCommitDate
    ) {
      contributionsByUsername[username].lastCommitDate = commitDate;
    }
  }

  // Process pull requests
  for (const pr of pullRequests) {
    const username = pr.user.login;

    // Skip if no username
    if (!username) continue;

    // Get the userId if we have a mapping
    const userId = usernameToUserId.get(username);

    // Initialize contribution record if needed
    if (!contributionsByUsername[username]) {
      contributionsByUsername[username] = {
        userId: userId || "",
        commits: 0,
        pullRequests: 0,
        additions: 0,
        deletions: 0,
        branchesCreated: 0,
        lastCommitDate: null,
      };
    }

    // Update pull request count
    contributionsByUsername[username].pullRequests += 1;
  }

  // Store contributions in the database
  for (const [username, contribution] of Object.entries(
    contributionsByUsername
  )) {
    if (!contribution.userId) continue; // Skip if we couldn't match to a user

    await midtermService.updateContribution({
      groupId,
      userId: contribution.userId,
      githubUsername: username,
      commits: contribution.commits,
      pullRequests: contribution.pullRequests,
      codeReviews: 0, // GitHub API doesn't track code reviews directly
      additions: contribution.additions,
      deletions: contribution.deletions,
      branchesCreated: contribution.branchesCreated,
      lastCommitDate: contribution.lastCommitDate,
      contributionData: {},
    });
  }
}

/**
 * Generate detailed metrics for visualization
 */
function generateDetailedMetrics(
  commits: GitHubCommit[],
  pullRequests: GitHubPullRequest[],
  branches: GitHubBranch[],
  contributors: GitHubContributor[]
): RepositoryVisualizationData {
  // Initialize visualization data structure
  const visualData: RepositoryVisualizationData = {
    name: "",
    description: "",
    url: "",
    commits: {
      count: commits.length,
      byAuthor: {},
      timeline: [],
    },
    branches: {
      count: branches.length,
      names: branches.map((b) => b.name),
      byCreator: {},
    },
    pullRequests: {
      count: pullRequests.length,
      open: pullRequests.filter((pr) => pr.state === "open").length,
      closed: pullRequests.filter(
        (pr) => pr.state === "closed" && !pr.merged_at
      ).length,
      merged: pullRequests.filter((pr) => pr.merged_at).length,
      byAuthor: {},
    },
    codebase: {
      additions: 0,
      deletions: 0,
    },
    contributors: {
      count: contributors.length,
      data: contributors.map((c) => ({
        username: c.login,
        contributions: c.contributions,
      })),
    },
    activity: {
      timeline: [],
    },
  };

  // Process commits for timeline and author stats
  const commitsByDate: Record<string, number> = {};
  const additionsByDate: Record<string, number> = {};
  const deletionsByDate: Record<string, number> = {};

  for (const commit of commits) {
    // Author stats
    const authorName = commit.author?.login || commit.commit.author.name;
    visualData.commits.byAuthor[authorName] =
      (visualData.commits.byAuthor[authorName] || 0) + 1;

    // Timeline data
    const date = commit.commit.author.date.split("T")[0]; // YYYY-MM-DD
    commitsByDate[date] = (commitsByDate[date] || 0) + 1;

    // Code stats
    if (commit.stats) {
      visualData.codebase.additions += commit.stats.additions;
      visualData.codebase.deletions += commit.stats.deletions;

      additionsByDate[date] =
        (additionsByDate[date] || 0) + commit.stats.additions;
      deletionsByDate[date] =
        (deletionsByDate[date] || 0) + commit.stats.deletions;
    }
  }

  // Process pull requests by author
  for (const pr of pullRequests) {
    const author = pr.user.login;
    visualData.pullRequests.byAuthor[author] =
      (visualData.pullRequests.byAuthor[author] || 0) + 1;

    // Add PR to timeline
    // const date = pr.created_at.split("T")[0]; // YYYY-MM-DD
  }

  // Build timeline data
  const allDates = new Set([
    ...Object.keys(commitsByDate),
    ...pullRequests.map((pr) => pr.created_at.split("T")[0]),
  ]);

  const sortedDates = Array.from(allDates).sort();

  sortedDates.forEach((date) => {
    const prCount = pullRequests.filter(
      (pr) => pr.created_at.split("T")[0] === date
    ).length;

    visualData.activity.timeline.push({
      date,
      commits: commitsByDate[date] || 0,
      pullRequests: prCount,
      additions: additionsByDate[date] || 0,
      deletions: deletionsByDate[date] || 0,
    });
  });

  // Sort timeline by date
  visualData.activity.timeline.sort((a, b) => a.date.localeCompare(b.date));

  // Build commits timeline for visualization
  visualData.commits.timeline = Object.entries(commitsByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return visualData;
}

/**
 * GitHub API helper functions
 */

async function fetchCommits(
  owner: string,
  repo: string,
  token: string
): Promise<GitHubCommit[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch commits: ${response.statusText}`);
  }

  return response.json();
}

async function fetchCommitDetails(
  owner: string,
  repo: string,
  sha: string,
  token: string
): Promise<GitHubCommit> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch commit details: ${response.statusText}`);
  }

  return response.json();
}

async function fetchPullRequests(
  owner: string,
  repo: string,
  token: string
): Promise<GitHubPullRequest[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch pull requests: ${response.statusText}`);
  }

  return response.json();
}

async function fetchBranches(
  owner: string,
  repo: string,
  token: string
): Promise<GitHubBranch[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch branches: ${response.statusText}`);
  }

  return response.json();
}

async function fetchContributors(
  owner: string,
  repo: string,
  token: string
): Promise<GitHubContributor[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch contributors: ${response.statusText}`);
  }

  return response.json();
}
