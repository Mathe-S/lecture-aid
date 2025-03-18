import { User } from "@supabase/supabase-js";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  created_at: string;
  updated_at: string;
}

export async function getUserRepositories(
  user: User | null
): Promise<GitHubRepo[]> {
  if (!user) {
    throw new Error("Not authenticated");
  }

  // Get GitHub token from user metadata
  const provider_token = user.app_metadata?.provider_token;

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
