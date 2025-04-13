"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Clock,
  Loader2,
  BarChart,
  RefreshCw,
  Users,
  Code,
  Github,
  ExternalLink,
} from "lucide-react";
import { RepositoryVisualizationData } from "@/lib/midterm-service";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data for visualization
const mockVisualizationData: RepositoryVisualizationData = {
  name: "flashcards-extension",
  description: "A browser extension for flashcards with hand gesture detection",
  url: "https://github.com/team-alpha/flashcards-extension",
  commits: {
    count: 86,
    byAuthor: {
      "jane-doe": 32,
      "john-smith": 41,
      "alex-jones": 13,
    },
    timeline: [
      { date: "2023-04-10", count: 5 },
      { date: "2023-04-11", count: 8 },
      { date: "2023-04-12", count: 3 },
      { date: "2023-04-13", count: 7 },
      { date: "2023-04-14", count: 11 },
      { date: "2023-04-15", count: 4 },
      { date: "2023-04-16", count: 0 },
      { date: "2023-04-17", count: 9 },
      { date: "2023-04-18", count: 12 },
      { date: "2023-04-19", count: 6 },
      { date: "2023-04-20", count: 8 },
      { date: "2023-04-21", count: 13 },
    ],
  },
  branches: {
    count: 6,
    names: [
      "main",
      "feat/extension-popup",
      "feat/hand-detection",
      "feat/card-storage",
      "fix/auth-issues",
      "docs/readme",
    ],
    byCreator: {
      "jane-doe": 2,
      "john-smith": 3,
      "alex-jones": 1,
    },
  },
  pullRequests: {
    count: 14,
    open: 2,
    closed: 1,
    merged: 11,
    byAuthor: {
      "jane-doe": 5,
      "john-smith": 7,
      "alex-jones": 2,
    },
  },
  codebase: {
    additions: 4283,
    deletions: 1205,
    byLanguage: {
      TypeScript: 65,
      JavaScript: 20,
      HTML: 10,
      CSS: 5,
    },
  },
  contributors: {
    count: 3,
    data: [
      {
        username: "jane-doe",
        displayName: "Jane Doe",
        contributions: 32,
        avatar: "https://github.com/ghost.png",
      },
      {
        username: "john-smith",
        displayName: "John Smith",
        contributions: 41,
        avatar: "https://github.com/ghost.png",
      },
      {
        username: "alex-jones",
        displayName: "Alex Jones",
        contributions: 13,
        avatar: "https://github.com/ghost.png",
      },
    ],
  },
  activity: {
    timeline: [
      {
        date: "2023-04-10",
        commits: 5,
        pullRequests: 1,
        additions: 350,
        deletions: 20,
      },
      {
        date: "2023-04-11",
        commits: 8,
        pullRequests: 2,
        additions: 520,
        deletions: 150,
      },
      {
        date: "2023-04-12",
        commits: 3,
        pullRequests: 0,
        additions: 120,
        deletions: 30,
      },
      {
        date: "2023-04-13",
        commits: 7,
        pullRequests: 1,
        additions: 480,
        deletions: 95,
      },
      {
        date: "2023-04-14",
        commits: 11,
        pullRequests: 2,
        additions: 730,
        deletions: 210,
      },
      {
        date: "2023-04-15",
        commits: 4,
        pullRequests: 0,
        additions: 290,
        deletions: 40,
      },
      {
        date: "2023-04-16",
        commits: 0,
        pullRequests: 0,
        additions: 0,
        deletions: 0,
      },
      {
        date: "2023-04-17",
        commits: 9,
        pullRequests: 1,
        additions: 410,
        deletions: 120,
      },
      {
        date: "2023-04-18",
        commits: 12,
        pullRequests: 3,
        additions: 680,
        deletions: 220,
      },
      {
        date: "2023-04-19",
        commits: 6,
        pullRequests: 1,
        additions: 180,
        deletions: 60,
      },
      {
        date: "2023-04-20",
        commits: 8,
        pullRequests: 2,
        additions: 310,
        deletions: 150,
      },
      {
        date: "2023-04-21",
        commits: 13,
        pullRequests: 1,
        additions: 213,
        deletions: 110,
      },
    ],
  },
};

const mockGroupName = "Team Alpha";

export default function RepositoryVisualizationPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [visualizationData, setVisualizationData] =
    useState<RepositoryVisualizationData | null>(null);
  const [groupName, setGroupName] = useState("");
  // const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Use our hook to fetch the group details ensuring id is a string
  // const { data: group, isLoading: isLoadingGroup } = useMidtermGroupDetails(
  //   id as string
  // );

  useEffect(() => {
    // Simulate fetching data
    setTimeout(() => {
      setVisualizationData(mockVisualizationData);
      setGroupName(mockGroupName);
      // setGroupMembers(mockGroupMembers);
      setLoading(false);
    }, 1500);
  }, [id]);

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refreshing data
    setTimeout(() => {
      setRefreshing(false);
      // Could update the visualization data here
    }, 2000);
  };

  const renderVisualization = useCallback(
    (visualizationData: RepositoryVisualizationData) => {
      // This would be replaced with actual D3.js code
      // to render a tree visualization of the GitHub activity
      const svg = svgRef.current;
      if (!svg || !visualizationData) return;

      // Clear previous content
      while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
      }

      // This is a placeholder for the actual visualization code
      // In a real implementation, this would use D3.js to create
      // a tree-like visualization of the repository activity

      // Draw the tree trunk (base repository)
      const trunk = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      trunk.setAttribute("x", "240");
      trunk.setAttribute("y", "400");
      trunk.setAttribute("width", "20");
      trunk.setAttribute("height", "100");
      trunk.setAttribute("fill", "brown");
      svg.appendChild(trunk);

      // Draw branches for each contributor
      const contributors = visualizationData.contributors.data;
      contributors.forEach((contributor, index) => {
        const angle = ((index - 1) * Math.PI) / 3;
        const length = 80 + contributor.contributions;

        const branch = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        branch.setAttribute("x1", "250");
        branch.setAttribute("y1", "400");
        branch.setAttribute("x2", `${250 + Math.cos(angle) * length}`);
        branch.setAttribute("y2", `${400 - Math.sin(angle) * length}`);
        branch.setAttribute("stroke", "brown");
        branch.setAttribute("stroke-width", "10");
        svg.appendChild(branch);

        // Add leaves proportional to commits
        const commits =
          visualizationData.commits.byAuthor[contributor.username] || 0;
        for (let i = 0; i < Math.min(commits, 20); i++) {
          const leafSize = 5 + Math.random() * 10;
          const leafDistance = 20 + Math.random() * (length - 30);
          const leafAngle = angle + (Math.random() * 0.5 - 0.25);

          const leaf = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
          );
          leaf.setAttribute(
            "cx",
            `${250 + Math.cos(leafAngle) * leafDistance}`
          );
          leaf.setAttribute(
            "cy",
            `${400 - Math.sin(leafAngle) * leafDistance}`
          );
          leaf.setAttribute("r", `${leafSize}`);
          leaf.setAttribute("fill", `hsl(${120 + index * 40}, 80%, 50%)`);
          svg.appendChild(leaf);
        }

        // Add contributor name
        const text = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        text.setAttribute("x", `${250 + Math.cos(angle) * (length + 20)}`);
        text.setAttribute("y", `${400 - Math.sin(angle) * (length + 20)}`);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", "black");
        text.textContent = contributor.displayName || contributor.username;
        svg.appendChild(text);
      });

      // Add a title to the visualization
      const title = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      title.setAttribute("x", "250");
      title.setAttribute("y", "30");
      title.setAttribute("text-anchor", "middle");
      title.setAttribute("font-size", "18");
      title.setAttribute("font-weight", "bold");
      title.textContent = "Repository Contribution Tree";
      svg.appendChild(title);
    },
    []
  );

  useEffect(() => {
    if (visualizationData && svgRef.current) {
      renderVisualization(visualizationData);
    }
  }, [visualizationData, renderVisualization]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <main className="container mx-auto py-10 px-4 md:px-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => router.push("/midterm")}
              className="pl-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Midterm
            </Button>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-2xl font-bold">{groupName} Visualization</h1>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2">Refresh Data</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sync latest data from GitHub</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {visualizationData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GitCommit className="h-4 w-4 text-blue-500" />
                    Commits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {visualizationData.commits.count}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Latest activity:{" "}
                    {visualizationData.activity.timeline.slice(-1)[0].date}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-green-500" />
                    Branches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {visualizationData.branches.count}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {Object.keys(visualizationData.branches.byCreator).length}{" "}
                    contributors
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GitPullRequest className="h-4 w-4 text-purple-500" />
                    Pull Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {visualizationData.pullRequests.count}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600">
                      {visualizationData.pullRequests.merged} merged
                    </span>
                    <span className="text-amber-600">
                      {visualizationData.pullRequests.open} open
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  {visualizationData.name}
                </CardTitle>
                <CardDescription>
                  {visualizationData.description}
                  <a
                    href={visualizationData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 inline-flex items-center text-blue-600 hover:underline"
                  >
                    View on GitHub
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue="tree" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="tree">Contribution Tree</TabsTrigger>
                    <TabsTrigger value="activity">
                      Activity Timeline
                    </TabsTrigger>
                    <TabsTrigger value="stats">Repository Stats</TabsTrigger>
                  </TabsList>

                  <TabsContent value="tree" className="space-y-4">
                    <div className="aspect-video w-full rounded-md border bg-white p-4 flex items-center justify-center">
                      <svg
                        ref={svgRef}
                        width="100%"
                        height="100%"
                        viewBox="0 0 500 500"
                        className="max-w-full max-h-[500px]"
                      />
                    </div>

                    <div className="text-sm text-center text-muted-foreground">
                      <p>
                        The tree visualization shows contributions by each team
                        member. Branches represent team members, and leaves
                        represent commits.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="space-y-4">
                    <div className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium">
                          Activity Timeline
                        </h3>

                        <Select defaultValue="commits">
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select metric" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="commits">Commits</SelectItem>
                            <SelectItem value="pullRequests">
                              Pull Requests
                            </SelectItem>
                            <SelectItem value="additions">
                              Code Additions
                            </SelectItem>
                            <SelectItem value="deletions">
                              Code Deletions
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="h-64 relative">
                        {/* This would be a real chart in production */}
                        <div className="absolute inset-0 flex items-end">
                          {visualizationData.activity.timeline.map((day, i) => (
                            <div
                              key={i}
                              className="flex-1 mx-0.5"
                              style={{ height: `${(day.commits / 15) * 100}%` }}
                            >
                              <div
                                className="w-full bg-blue-500 rounded-t-sm"
                                style={{ height: "100%" }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between mt-2 text-xs text-slate-500">
                        {visualizationData.activity.timeline
                          .filter((_, i) => i % 3 === 0)
                          .map((day, i) => (
                            <div key={i}>
                              {day.date.split("-").slice(1).join("/")}
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-sm font-medium flex items-center">
                            <Code className="h-4 w-4 mr-2 text-emerald-500" />
                            Code Additions
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-2xl font-bold text-emerald-600">
                            {visualizationData.codebase.additions.toLocaleString()}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Lines of code added
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-sm font-medium flex items-center">
                            <Code className="h-4 w-4 mr-2 text-red-500" />
                            Code Deletions
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-2xl font-bold text-red-600">
                            {visualizationData.codebase.deletions.toLocaleString()}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Lines of code removed
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-sm font-medium flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-blue-500" />
                            Active Days
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-2xl font-bold text-blue-600">
                            {
                              visualizationData.activity.timeline.filter(
                                (day) => day.commits > 0 || day.pullRequests > 0
                              ).length
                            }
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Days with activity
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-sm font-medium flex items-center">
                            <BarChart className="h-4 w-4 mr-2 text-purple-500" />
                            Avg. Daily Commits
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-2xl font-bold text-purple-600">
                            {(
                              visualizationData.commits.count /
                              visualizationData.activity.timeline.length
                            ).toFixed(1)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Commits per day
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="stats" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            Contributors
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {visualizationData.contributors.data.map(
                              (contributor, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                      <Users className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <div>
                                      <div className="font-medium">
                                        {contributor.displayName}
                                      </div>
                                      <div className="text-sm text-muted-foreground flex items-center">
                                        <Github className="h-3 w-3 mr-1" />
                                        {contributor.username}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium">
                                      {contributor.contributions}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      commits
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Languages</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {visualizationData.codebase.byLanguage && (
                              <div className="space-y-3">
                                {Object.entries(
                                  visualizationData.codebase.byLanguage
                                ).map(([lang, percentage], i) => (
                                  <div key={i}>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span>{lang}</span>
                                      <span>{percentage}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${
                                          i === 0
                                            ? "bg-blue-500"
                                            : i === 1
                                            ? "bg-yellow-500"
                                            : i === 2
                                            ? "bg-green-500"
                                            : "bg-purple-500"
                                        }`}
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Branches</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {visualizationData.branches.names.map(
                                (branch, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-2 text-sm p-2 rounded-lg bg-slate-50"
                                  >
                                    <GitBranch className="h-4 w-4 text-slate-500" />
                                    <span className="font-mono">{branch}</span>
                                  </div>
                                )
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
