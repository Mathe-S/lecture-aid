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
import { useMidtermGroupDetails } from "@/hooks/useMidtermGroups";
import { useQueryClient } from "@tanstack/react-query";
import { midtermKeys } from "@/hooks/useMidtermGroups";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function transformDataForVisualization(
  group: any
): RepositoryVisualizationData | null {
  if (!group || !group.metrics || !group.metrics.detailedMetrics) {
    return null;
  }

  const metrics = group.metrics;
  const detailed = metrics.detailedMetrics;

  const visualizationData: RepositoryVisualizationData = {
    name: group.repositoryName || "Repository",
    description: group.description || "",
    url: group.repositoryUrl || "",
    commits: {
      count: metrics.totalCommits || 0,
      byAuthor: detailed.commitsByAuthor || {},
      timeline: (detailed.weeklyCommitActivity || []).map((w: any) => ({
        date: new Date(w.week * 1000).toISOString().split("T")[0],
        count: w.commits,
      })),
    },
    branches: {
      count: metrics.totalBranches || 0,
      names: detailed.branchNames || [],
      byCreator: {},
    },
    pullRequests: {
      count: metrics.totalPullRequests || 0,
      open: detailed.openPRs || 0,
      closed: detailed.closedPRs || 0,
      merged: detailed.mergedPRs || 0,
      byAuthor: detailed.prsByAuthor || {},
    },
    codebase: {
      additions: metrics.codeAdditions || 0,
      deletions: metrics.codeDeletions || 0,
      byLanguage: detailed.languages || {},
    },
    contributors: {
      count: metrics.contributorsCount || 0,
      data: (group.contributions || []).map((c: any) => ({
        username: c.githubUsername || "unknown",
        displayName: c.profile?.fullName || c.githubUsername || "Unknown",
        contributions: c.commits || 0,
        avatar: c.profile?.avatarUrl || "https://github.com/ghost.png",
      })),
    },
    activity: {
      timeline: (detailed.weeklyCommitActivity || []).map((w: any) => ({
        date: new Date(w.week * 1000).toISOString().split("T")[0],
        commits: w.commits || 0,
        pullRequests: 0,
        additions: w.additions || 0,
        deletions: w.deletions || 0,
      })),
    },
  };

  return visualizationData;
}

export default function RepositoryVisualizationPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: group,
    isLoading,
    error,
  } = useMidtermGroupDetails(id as string);

  const [visualizationData, setVisualizationData] =
    useState<RepositoryVisualizationData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (group) {
      const transformed = transformDataForVisualization(group);
      setVisualizationData(transformed);
    }
  }, [group]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({
      queryKey: midtermKeys.group(id as string),
    });
    setTimeout(() => setRefreshing(false), 500);
  };

  const renderVisualization = useCallback(
    (visData: RepositoryVisualizationData) => {
      const svg = svgRef.current;
      if (!svg || !visData) return;

      while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
      }

      const width = 500;
      const height = 500;
      const centerX = width / 2;
      const trunkBaseY = height - 50;
      const trunkHeight = 80;
      const trunkTopY = trunkBaseY - trunkHeight;
      const trunkWidth = 25;

      const branchColor = "#A0522D";
      const leafColors = [
        "#8FBC8F",
        "#98FB98",
        "#90EE90",
        "#3CB371",
        "#2E8B57",
      ];
      const textFill = "#4A5568";
      const minBranchLength = 60;
      const maxBranchLengthAddition = 120;

      const trunkPath = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      trunkPath.setAttribute(
        "d",
        `M ${centerX - trunkWidth / 2} ${trunkBaseY} 
          Q ${centerX - trunkWidth / 4} ${trunkBaseY - trunkHeight / 2}, ${
          centerX - trunkWidth / 6
        } ${trunkTopY} 
          L ${centerX + trunkWidth / 6} ${trunkTopY} 
          Q ${centerX + trunkWidth / 4} ${trunkBaseY - trunkHeight / 2}, ${
          centerX + trunkWidth / 2
        } ${trunkBaseY} 
          Z`
      );
      trunkPath.setAttribute("fill", branchColor);
      trunkPath.setAttribute("filter", "url(#trunk-texture)");
      svg.appendChild(trunkPath);

      const defs = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "defs"
      );
      const filter = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "filter"
      );
      filter.setAttribute("id", "trunk-texture");
      const turbulence = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "feTurbulence"
      );
      turbulence.setAttribute("type", "fractalNoise");
      turbulence.setAttribute("baseFrequency", "0.02 0.05");
      turbulence.setAttribute("numOctaves", "2");
      turbulence.setAttribute("result", "noise");
      filter.appendChild(turbulence);
      const displace = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "feDisplacementMap"
      );
      displace.setAttribute("in", "SourceGraphic");
      displace.setAttribute("in2", "noise");
      displace.setAttribute("scale", "3");
      displace.setAttribute("xChannelSelector", "R");
      displace.setAttribute("yChannelSelector", "G");
      filter.appendChild(displace);
      defs.appendChild(filter);
      svg.appendChild(defs);

      const contributors = visData.contributors.data;
      if (!contributors || contributors.length === 0) return;

      const maxContributions = Math.max(
        1,
        ...contributors.map((c) => c.contributions || 0)
      );
      const totalContributors = contributors.length;
      const angleSpread = Math.PI * 0.8;
      const startAngle = -Math.PI / 2 - angleSpread / 2;

      contributors.forEach((contributor, index) => {
        const contributionRatio =
          maxContributions > 0
            ? (contributor.contributions || 0) / maxContributions
            : 0;
        const length =
          minBranchLength + contributionRatio * maxBranchLengthAddition;
        const angle =
          startAngle + (angleSpread / (totalContributors + 1)) * (index + 1);
        const endX = centerX + Math.cos(angle) * length;
        const endY = trunkTopY + Math.sin(angle) * length;
        const controlX = centerX + Math.cos(angle) * length * 0.5;
        const controlY = trunkTopY + Math.sin(angle) * length * 0.5;
        const branchWidthStart = 12;
        const branchWidthEnd = 4;

        const branch = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        const anglePerp = angle + Math.PI / 2;
        const startOffsetX = (Math.cos(anglePerp) * branchWidthStart) / 2;
        const startOffsetY = (Math.sin(anglePerp) * branchWidthStart) / 2;
        const endOffsetX = (Math.cos(anglePerp) * branchWidthEnd) / 2;
        const endOffsetY = (Math.sin(anglePerp) * branchWidthEnd) / 2;

        branch.setAttribute(
          "d",
          `M ${centerX - startOffsetX} ${trunkTopY - startOffsetY} 
             Q ${controlX} ${controlY}, ${endX - endOffsetX} ${
            endY - endOffsetY
          } 
             L ${endX + endOffsetX} ${endY + endOffsetY} 
             Q ${controlX} ${controlY}, ${centerX + startOffsetX} ${
            trunkTopY + startOffsetY
          } 
             Z`
        );
        branch.setAttribute("fill", branchColor);
        branch.setAttribute("stroke", "#663300");
        branch.setAttribute("stroke-width", "0.5");

        const branchTitle = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "title"
        );
        branchTitle.textContent = `${
          contributor.displayName || contributor.username
        }: ${contributor.contributions} commits`;
        branch.appendChild(branchTitle);

        svg.appendChild(branch);

        const commits = visData.commits.byAuthor[contributor.username] || 0;
        const leafCount = Math.min(commits * 2, 60);

        for (let i = 0; i < leafCount; i++) {
          const leafSizeX = 3 + Math.random() * 4;
          const leafSizeY = leafSizeX * (0.7 + Math.random() * 0.6);
          const leafDistanceRatio = 0.3 + Math.random() * 0.7;
          const leafDist = length * leafDistanceRatio;
          const placementAngle = angle + (Math.random() - 0.5) * 0.5;
          const leafX = centerX + Math.cos(placementAngle) * leafDist;
          const leafY = trunkTopY + Math.sin(placementAngle) * leafDist;
          const leafRotation = Math.random() * 360;

          const leaf = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "ellipse"
          );
          leaf.setAttribute("cx", `${leafX}`);
          leaf.setAttribute("cy", `${leafY}`);
          leaf.setAttribute("rx", `${leafSizeX}`);
          leaf.setAttribute("ry", `${leafSizeY}`);
          leaf.setAttribute("fill", leafColors[i % leafColors.length]);
          leaf.setAttribute("fill-opacity", `${0.6 + Math.random() * 0.4}`);
          leaf.setAttribute(
            "transform",
            `rotate(${leafRotation} ${leafX} ${leafY})`
          );
          leaf.setAttribute("stroke", "#2E8B57");
          leaf.setAttribute("stroke-width", "0.3");

          const leafTitle = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "title"
          );
          leafTitle.textContent = `${commits} commits by ${
            contributor.displayName || contributor.username
          }`;
          leaf.appendChild(leafTitle);

          svg.appendChild(leaf);
        }

        const text = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        const textOffset = 15;
        const textX = centerX + Math.cos(angle) * (length + textOffset);
        const textY = trunkTopY + Math.sin(angle) * (length + textOffset);
        text.setAttribute("x", `${textX}`);
        text.setAttribute("y", `${textY}`);
        text.setAttribute(
          "text-anchor",
          Math.abs(angle + Math.PI / 2) < 0.1
            ? "middle"
            : angle + Math.PI / 2 < 0
            ? "start"
            : "end"
        );
        text.setAttribute("dy", "0.3em");
        text.setAttribute("fill", textFill);
        text.setAttribute("font-size", "11px");
        text.setAttribute("font-weight", "500");
        text.textContent = contributor.displayName || contributor.username;
        svg.appendChild(text);
      });

      const title = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      title.setAttribute("x", `${centerX}`);
      title.setAttribute("y", "35");
      title.setAttribute("text-anchor", "middle");
      title.setAttribute("font-size", "18");
      title.setAttribute("font-weight", "600");
      title.setAttribute("fill", textFill);
      title.textContent = `Contribution Tree: ${group?.name || "Group"}`;
      svg.appendChild(title);
    },
    [group]
  );

  useEffect(() => {
    if (visualizationData && svgRef.current) {
      renderVisualization(visualizationData);
    }
  }, [visualizationData, renderVisualization]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 px-4 md:px-6 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Error Loading Group Details
        </h1>
        <p className="text-muted-foreground mb-4">{(error as Error).message}</p>
        <Button onClick={() => router.push("/midterm")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Midterm Projects
        </Button>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto py-10 px-4 md:px-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Group Not Found</h1>
        <p className="text-muted-foreground mb-4">
          The group you are looking for does not exist or you may not have
          access.
        </p>
        <Button onClick={() => router.push("/midterm")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Midterm Projects
        </Button>
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
              onClick={() => router.push(`/midterm/groups/${id}`)}
              className="pl-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Group Details
            </Button>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-2xl font-bold">{group.name} Visualization</h1>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing || isLoading}
                >
                  {refreshing || isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2">Refresh Data</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refetch latest data from database</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {!visualizationData ? (
          <Card>
            <CardHeader>
              <CardTitle>Loading Visualization Data...</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : (
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
                  {visualizationData.commits.timeline.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Latest activity:{" "}
                      {visualizationData.commits.timeline.slice(-1)[0].date}
                    </div>
                  )}
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
                  {visualizationData.url && (
                    <a
                      href={visualizationData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 inline-flex items-center text-blue-600 hover:underline"
                    >
                      View on GitHub
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
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
                    <div className="aspect-[4/3] w-full rounded-md border bg-gradient-to-b from-sky-50 to-white p-4 flex items-center justify-center overflow-hidden">
                      <svg
                        ref={svgRef}
                        width="100%"
                        height="100%"
                        viewBox="0 0 500 500"
                        preserveAspectRatio="xMidYMid meet"
                        className="max-w-full max-h-[500px]"
                      />
                    </div>
                    <div className="text-sm text-center text-muted-foreground">
                      <p>
                        Contribution tree: Branch length scales with commit
                        count. Hover for details.
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

                      <div className="h-64 relative bg-slate-50 rounded">
                        <div className="absolute inset-0 flex items-end p-2">
                          {visualizationData.activity.timeline.map((day, i) => {
                            const maxVal = Math.max(
                              1,
                              ...visualizationData.activity.timeline.map(
                                (d) => d.commits
                              )
                            );
                            const heightPercent = (day.commits / maxVal) * 100;
                            return (
                              <div
                                key={i}
                                className="flex-1 mx-0.5 flex flex-col justify-end items-center group relative"
                              >
                                <TooltipProvider delayDuration={100}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div
                                        className="w-full bg-blue-400 hover:bg-blue-600 transition-colors rounded-t-sm"
                                        style={{ height: `${heightPercent}%` }}
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{day.date}</p>
                                      <p>Commits: {day.commits}</p>
                                      <p>Additions: {day.additions}</p>
                                      <p>Deletions: {day.deletions}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-between mt-2 text-xs text-slate-500 px-2">
                        {visualizationData.activity.timeline.length > 0 && (
                          <span>
                            {visualizationData.activity.timeline[0].date}
                          </span>
                        )}
                        {visualizationData.activity.timeline.length > 0 && (
                          <span>
                            {
                              visualizationData.activity.timeline.slice(-1)[0]
                                .date
                            }
                          </span>
                        )}
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
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage
                                          src={contributor.avatar}
                                          alt={contributor.displayName}
                                        />
                                        <AvatarFallback>
                                          {contributor.displayName}
                                        </AvatarFallback>
                                      </Avatar>
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
                            {visualizationData.codebase.byLanguage &&
                            Object.keys(visualizationData.codebase.byLanguage)
                              .length > 0 ? (
                              <ul className="space-y-2">
                                {Object.entries(
                                  visualizationData.codebase.byLanguage
                                )
                                  .sort(([, a], [, b]) => b - a)
                                  .map(([lang, bytes]) => (
                                    <li
                                      key={lang}
                                      className="flex justify-between items-center text-sm"
                                    >
                                      <span>{lang}</span>
                                      <span className="font-mono">
                                        {bytes.toLocaleString()} bytes
                                      </span>
                                    </li>
                                  ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No language data available.
                              </p>
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

                  <TabsContent value="languages">
                    <Card>
                      <CardHeader>
                        <CardTitle>Languages</CardTitle>
                        <CardDescription>
                          Breakdown by language (bytes)
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {visualizationData.codebase.byLanguage &&
                        Object.keys(visualizationData.codebase.byLanguage)
                          .length > 0 ? (
                          <ul className="space-y-2">
                            {Object.entries(
                              visualizationData.codebase.byLanguage
                            )
                              .sort(([, a], [, b]) => b - a)
                              .map(([lang, bytes]) => (
                                <li
                                  key={lang}
                                  className="flex justify-between items-center text-sm"
                                >
                                  <span>{lang}</span>
                                  <span className="font-mono">
                                    {bytes.toLocaleString()} bytes
                                  </span>
                                </li>
                              ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No language data available.
                          </p>
                        )}
                      </CardContent>
                    </Card>
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
