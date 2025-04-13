import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  Code,
  User,
  Calendar,
} from "lucide-react";
import { MidtermRepositoryMetric } from "@/db/drizzle/midterm-schema";

// Helper function to format dates
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

interface GitHubMetricsCardProps {
  metrics: MidtermRepositoryMetric;
  repoUrl?: string | null;
}

export function GitHubMetricsCard({
  metrics,
  repoUrl,
}: GitHubMetricsCardProps) {
  if (!metrics || !metrics.id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Repository Metrics</CardTitle>
          <CardDescription>No metrics available yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Connect a GitHub repository to see metrics
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-blue-500" />
          Repository Metrics
        </CardTitle>
        <CardDescription>
          {repoUrl ? (
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {repoUrl.replace("https://github.com/", "")}
            </a>
          ) : (
            "GitHub Repository"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <MetricItem
            icon={<GitCommit className="h-4 w-4 text-blue-500" />}
            label="Commits"
            value={metrics.totalCommits || 0}
          />
          <MetricItem
            icon={<GitPullRequest className="h-4 w-4 text-green-500" />}
            label="Pull Requests"
            value={metrics.totalPullRequests || 0}
          />
          <MetricItem
            icon={<GitBranch className="h-4 w-4 text-orange-500" />}
            label="Branches"
            value={metrics.totalBranches || 0}
          />
          <MetricItem
            icon={<User className="h-4 w-4 text-purple-500" />}
            label="Contributors"
            value={metrics.contributorsCount || 0}
          />
          <MetricItem
            icon={<Code className="h-4 w-4 text-teal-500" />}
            label="Code Changes"
            value={
              <span>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                  +{metrics.codeAdditions || 0}
                </Badge>
                <Badge variant="destructive" className="ml-1">
                  -{metrics.codeDeletions || 0}
                </Badge>
              </span>
            }
          />
          <MetricItem
            icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
            label="Last Updated"
            value={
              metrics.lastUpdated
                ? formatDate(new Date(metrics.lastUpdated))
                : "Never"
            }
          />
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Data synced from GitHub repository
      </CardFooter>
    </Card>
  );
}

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function MetricItem({ icon, label, value }: MetricItemProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
