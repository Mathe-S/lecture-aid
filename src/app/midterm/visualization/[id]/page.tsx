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
    console.warn(
      "Visualization transform failed: Missing group or metrics data."
    );
    return null;
  }

  const metrics = group.metrics;
  const detailed = metrics.detailedMetrics;
  const contributions = group.contributions || [];

  // Helper to safely get numbers
  const getNum = (val: any): number => (typeof val === "number" ? val : 0);

  // Pre-calculate PRs per author for easier lookup
  const prsByUsername: Record<string, number> = {};
  if (detailed.prsByAuthor) {
    Object.entries(detailed.prsByAuthor).forEach(([username, count]) => {
      prsByUsername[username] = getNum(count);
    });
  }

  const visualizationData: RepositoryVisualizationData = {
    name: group.repositoryName || "Repository",
    description: group.description || "",
    url: group.repositoryUrl || "",
    commits: {
      count: getNum(metrics.totalCommits),
      byAuthor: detailed.commitsByAuthor || {},
      timeline: (detailed.weeklyTimeline || []).map((w: any) => ({
        // Use weeklyTimeline if available
        date: w.date,
        count: getNum(w.commits),
      })),
    },
    branches: {
      count: getNum(metrics.totalBranches),
      names: detailed.branchNames || [],
      byCreator: {}, // Still not tracked easily
    },
    pullRequests: {
      count: getNum(metrics.totalPullRequests),
      open: getNum(detailed.openPRs),
      closed: getNum(detailed.closedPRs),
      merged: getNum(detailed.mergedPRs),
      byAuthor: prsByUsername, // Use the pre-calculated map
    },
    codebase: {
      additions: getNum(metrics.codeAdditions),
      deletions: getNum(metrics.codeDeletions),
      byLanguage: detailed.languages || {},
    },
    contributors: {
      count: contributions.length, // Base count on actual contribution records
      data: contributions.map((c: any) => {
        const username = c.githubUsername || "unknown";
        const commits = getNum(c.commits);
        const additions = getNum(c.additions);
        const deletions = getNum(c.deletions);
        const totalLoc = additions + deletions;
        const prs = prsByUsername[username] || 0;

        return {
          username: username,
          displayName: c.profile?.fullName || username,
          avatar: c.profile?.avatarUrl || `https://github.com/${username}.png`, // Fallback GitHub avatar
          commits: commits,
          additions: additions,
          deletions: deletions,
          totalLoc: totalLoc, // Add total lines changed
          pullRequests: prs, // Add PR count
          // Deprecate 'contributions' if it strictly meant commits before
          // contributions: commits,
        };
      }),
    },
    activity: {
      // Use the richer timeline if available
      timeline: (detailed.weeklyTimeline || []).map((w: any) => ({
        date: w.date,
        commits: getNum(w.commits),
        pullRequests: 0, // Still difficult to get weekly PR count easily
        additions: getNum(w.additions),
        deletions: getNum(w.deletions),
      })),
    },
  };

  // Filter out contributors with no identifiable activity if desired (optional)
  // visualizationData.contributors.data = visualizationData.contributors.data.filter(c => c.commits > 0 || c.totalLoc > 0 || c.pullRequests > 0);
  // visualizationData.contributors.count = visualizationData.contributors.data.length;

  console.log("Transformed Visualization Data:", visualizationData);
  return visualizationData;
}

// Tooltip state interface
interface TooltipInfo {
  visible: boolean;
  content: string;
  x: number;
  y: number;
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
  const containerRef = useRef<HTMLDivElement>(null); // Ref for the container div

  // State for tooltip
  const [tooltip, setTooltip] = useState<TooltipInfo>({
    visible: false,
    content: "",
    x: 0,
    y: 0,
  });

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

  // --- Render Visualization Function ---
  const renderVisualization = useCallback(
    (visData: RepositoryVisualizationData, svgElement: SVGSVGElement) => {
      while (svgElement.firstChild) {
        svgElement.removeChild(svgElement.firstChild);
      }

      // --- Dynamic Dimensions ---
      const bounds = svgElement.getBoundingClientRect();
      const width = bounds.width;
      const height = bounds.height;
      if (width === 0 || height === 0) return; // Don't render if size is invalid

      const centerX = width / 2;
      const centerY = height / 2;
      const baseDimension = Math.min(width, height); // Use smaller dimension for scaling

      // --- Constants & Layout ---
      const starRadius = baseDimension * 0.08;
      const planetSizeScale = baseDimension * 0.05; // Slightly increased scale
      const textFill = "#e2e8f0";
      const orbitColor = "rgba(255, 255, 255, 0.15)";
      const prMoonColor = "#a78bfa"; // Violet for PRs
      const commitMoonColor = "#94a3b8"; // Slate for Commits
      const planetColors = [
        "#f97316", // orange
        "#ec4899", // pink
        "#8b5cf6", // violet
        "#3b82f6", // blue
        "#14b8a6", // teal
        "#84cc16", // lime
        "#facc15", // amber
      ];
      const orbitRadii = [
        baseDimension * 0.2,
        baseDimension * 0.3,
        baseDimension * 0.4,
        baseDimension * 0.5,
        baseDimension * 0.6,
      ];

      // --- SVG Definitions ---
      const defs = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "defs"
      );

      // Star Gradient
      const starGrad = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "radialGradient"
      );
      starGrad.setAttribute("id", "starGradient");
      starGrad.innerHTML = `
        <stop offset="0%" stop-color="#fffbeb" stop-opacity="1"/>
        <stop offset="70%" stop-color="#fef3c7" stop-opacity="1"/>
        <stop offset="100%" stop-color="#fde68a" stop-opacity="0.8"/>
      `;
      defs.appendChild(starGrad);

      // Avatar patterns (will be added inside the loop)
      svgElement.appendChild(defs);

      // --- Background ---
      const background = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      background.setAttribute("width", "100%");
      background.setAttribute("height", "100%");
      background.setAttribute("fill", "#0f172a");
      svgElement.appendChild(background);

      // --- Draw Central Star (Repository) ---
      const starGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );
      starGroup.style.cursor = "pointer"; // Indicate interactivity
      const star = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      star.setAttribute("cx", `${centerX}`);
      star.setAttribute("cy", `${centerY}`);
      star.setAttribute("r", `${starRadius}`);
      star.setAttribute("fill", "url(#starGradient)");
      star.setAttribute("stroke", "#fef3c7");
      star.setAttribute("stroke-width", "1");
      starGroup.appendChild(star);

      const starLabel = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      starLabel.setAttribute("x", `${centerX}`);
      starLabel.setAttribute("y", `${centerY + starRadius + 12}`); // Adjust label position
      starLabel.setAttribute("dy", "0.35em");
      starLabel.setAttribute("text-anchor", "middle");
      starLabel.setAttribute("fill", textFill);
      starLabel.setAttribute(
        "font-size",
        `${Math.max(8, baseDimension * 0.02)}px`
      ); // Dynamic font size
      starLabel.setAttribute("font-family", "sans-serif");
      starLabel.textContent = visData.name;
      starGroup.appendChild(starLabel);
      svgElement.appendChild(starGroup);

      // Star Hover Event (Update Tooltip Position)
      starGroup.addEventListener("mouseover", (event) => {
        const svgBounds = svgElement.getBoundingClientRect();
        const relX = event.clientX - svgBounds.left;
        const relY = event.clientY - svgBounds.top;
        const starTooltipContent = `Repository: ${visData.name}\nCommits: ${visData.commits.count}\nPRs: ${visData.pullRequests.count}\nBranches: ${visData.branches.count}`;
        setTooltip({
          visible: true,
          content: starTooltipContent,
          x: relX, // Use relative X
          y: relY, // Use relative Y
        });
        star.setAttribute("filter", "brightness(1.2)"); // Slight highlight
      });
      starGroup.addEventListener("mouseout", () => {
        setTooltip({ visible: false, content: "", x: 0, y: 0 });
        star.removeAttribute("filter");
      });
      starGroup.addEventListener("click", () => {
        if (visData.url) window.open(visData.url, "_blank");
      });

      // --- Prepare Contributor Data (Size by Commits) ---
      const contributors = visData.contributors.data.filter(
        (c) => c.totalLoc > 0 || c.commits > 0 || c.pullRequests > 0
      );
      if (contributors.length === 0) return;

      const displayContributors = contributors
        .sort((a, b) => b.commits - a.commits) // Sort by COMMITS descending
        .slice(0, 5);

      // Calculate max commits for sizing
      const maxCommits = Math.max(
        1,
        ...displayContributors.map((c) => c.commits)
      );

      // --- Draw Planets (Contributors) and Orbits ---
      const planetsGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );
      svgElement.appendChild(planetsGroup);

      displayContributors.forEach((contributor, index) => {
        const orbitRadius = orbitRadii[index];
        const initialAngle = Math.random() * Math.PI * 2;
        const planetX = centerX + Math.cos(initialAngle) * orbitRadius;
        const planetY = centerY + Math.sin(initialAngle) * orbitRadius;
        const color = planetColors[index % planetColors.length];

        // Draw Orbit Path
        const orbit = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle"
        );
        orbit.setAttribute("cx", `${centerX}`);
        orbit.setAttribute("cy", `${centerY}`);
        orbit.setAttribute("r", `${orbitRadius}`);
        orbit.setAttribute("fill", "none");
        orbit.setAttribute("stroke", orbitColor);
        orbit.setAttribute("stroke-width", "0.5");
        orbit.setAttribute("stroke-dasharray", "3 3");
        planetsGroup.appendChild(orbit);

        // Calculate planet size based on COMMITS
        const contributionRatio = contributor.commits / maxCommits;
        const basePlanetRadius = baseDimension * 0.02; // Increased base size (2%)
        const planetRadius =
          basePlanetRadius + contributionRatio * planetSizeScale;

        // Define pattern for avatar
        const patternId = `pattern-${contributor.username.replace(
          /[^a-zA-Z0-9]/g,
          ""
        )}`; // Sanitize username for ID
        if (contributor.avatar) {
          const pattern = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "pattern"
          );
          pattern.setAttribute("id", patternId);
          pattern.setAttribute("height", "100%");
          pattern.setAttribute("width", "100%");
          pattern.setAttribute("patternContentUnits", "objectBoundingBox");
          const image = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "image"
          );
          image.setAttribute("href", contributor.avatar || ""); // Ensure href is not null
          image.setAttribute("preserveAspectRatio", "xMidYMid slice");
          image.setAttribute("height", "1");
          image.setAttribute("width", "1");
          pattern.appendChild(image);
          defs.appendChild(pattern);
        }

        // --- Draw Planet (Contributor) ---
        const planet = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle"
        );
        planet.setAttribute("cx", `${planetX}`);
        planet.setAttribute("cy", `${planetY}`);
        planet.setAttribute("r", `${planetRadius}`);
        planet.setAttribute(
          "fill",
          contributor.avatar ? `url(#${patternId})` : color
        );
        planet.setAttribute("stroke", "rgba(255, 255, 255, 0.5)");
        planet.setAttribute("stroke-width", "1");
        planet.style.cursor = "pointer";
        planet.style.transition =
          "transform 0.2s ease-out, filter 0.2s ease-out"; // Smooth hover effect
        planetsGroup.appendChild(planet);

        // --- Planet Hover Events (Update Tooltip Position) ---
        planet.addEventListener("mouseover", (event) => {
          const svgBounds = svgElement.getBoundingClientRect();
          const relX = event.clientX - svgBounds.left;
          const relY = event.clientY - svgBounds.top;
          const tooltipContent =
            `${contributor.displayName} (${contributor.username})\n` +
            `Commits: ${contributor.commits}\n` +
            `LoC: +${contributor.additions}/-${contributor.deletions} (${contributor.totalLoc})\n` +
            `PRs: ${contributor.pullRequests}`;
          setTooltip({
            visible: true,
            content: tooltipContent,
            x: relX, // Use relative X
            y: relY, // Use relative Y
          });
          planet.setAttribute("filter", "brightness(1.3)");
        });

        planet.addEventListener("mouseout", () => {
          setTooltip({ visible: false, content: "", x: 0, y: 0 });
          planet.removeAttribute("filter");
        });

        // --- Draw Moons (Commits & PRs) ---
        const moonOrbitRadius =
          planetRadius + Math.max(4, baseDimension * 0.008); // Moons orbit slightly further out, scale with size
        const baseMoonRadius = Math.max(1, baseDimension * 0.002); // Base moon size 0.2%
        const commitMoonRadius = baseMoonRadius;
        const prMoonRadius = baseMoonRadius * 1.8; // PR moons larger

        const numCommits = contributor.commits;
        const numPRs = contributor.pullRequests;
        const totalMoons = numCommits + numPRs;
        const angleStep = totalMoons > 0 ? (Math.PI * 2) / totalMoons : 0;

        let currentAngle = Math.random() * Math.PI * 2; // Start angle for moons

        // Draw Commit Moons (Smaller, Gray)
        for (let i = 0; i < numCommits; i++) {
          const moonX = planetX + Math.cos(currentAngle) * moonOrbitRadius;
          const moonY = planetY + Math.sin(currentAngle) * moonOrbitRadius;
          const moon = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
          );
          moon.setAttribute("cx", `${moonX}`);
          moon.setAttribute("cy", `${moonY}`);
          moon.setAttribute("r", `${commitMoonRadius}`);
          moon.setAttribute("fill", commitMoonColor);
          moon.style.pointerEvents = "none"; // Don't block planet hover
          planetsGroup.appendChild(moon);
          currentAngle += angleStep;
        }

        // Draw PR Moons (Larger, Violet)
        for (let i = 0; i < numPRs; i++) {
          const moonX = planetX + Math.cos(currentAngle) * moonOrbitRadius;
          const moonY = planetY + Math.sin(currentAngle) * moonOrbitRadius;
          const moon = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
          );
          moon.setAttribute("cx", `${moonX}`);
          moon.setAttribute("cy", `${moonY}`);
          moon.setAttribute("r", `${prMoonRadius}`);
          moon.setAttribute("fill", prMoonColor);
          moon.style.pointerEvents = "none"; // Don't block planet hover
          planetsGroup.appendChild(moon);
          currentAngle += angleStep;
        }
      });

      // --- Draw Title ---
      const title = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      title.setAttribute("x", `${centerX}`);
      title.setAttribute("y", `${baseDimension * 0.08}`); // Position title relative to size
      title.setAttribute("text-anchor", "middle");
      title.setAttribute(
        "font-size",
        `${Math.max(16, baseDimension * 0.035)}px`
      ); // Dynamic font size
      title.setAttribute("font-family", "sans-serif");
      title.setAttribute("font-weight", "600");
      title.setAttribute("fill", textFill);
      svgElement.appendChild(title);
    },
    [setTooltip] // Add setTooltip to dependency array
  );

  // useEffect to call renderVisualization when data/size changes
  useEffect(() => {
    const svg = svgRef.current;
    if (visualizationData && svg && containerRef.current) {
      // Use ResizeObserver to re-render on container resize
      const resizeObserver = new ResizeObserver(() => {
        renderVisualization(visualizationData, svg);
      });
      resizeObserver.observe(containerRef.current);

      // Initial render
      renderVisualization(visualizationData, svg);

      // Cleanup observer on unmount
      return () => resizeObserver.disconnect();
    }
  }, [visualizationData, renderVisualization]); // Removed svgRef from dependencies as it's stable

  // --- Loading/Error/Not Found States ---
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

        {!visualizationData && !isLoading ? (
          <Card>
            <CardHeader>
              <CardTitle>Generating Visualization...</CardTitle>
              <CardDescription>
                Fetching data and preparing the orbit.
              </CardDescription>
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
                    {visualizationData?.commits.count}
                  </div>
                  {visualizationData?.commits.timeline.length &&
                    visualizationData?.commits.timeline.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Latest activity:{" "}
                        {visualizationData?.commits.timeline.slice(-1)[0].date}
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
                    {visualizationData?.branches.count}
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
                    {visualizationData?.pullRequests.count}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600">
                      {visualizationData?.pullRequests.merged} merged
                    </span>
                    <span className="text-amber-600">
                      {visualizationData?.pullRequests.open} open
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  {visualizationData?.name}
                </CardTitle>
                <CardDescription>
                  {visualizationData?.description}
                  {visualizationData?.url && (
                    <a
                      href={visualizationData?.url}
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
                <Tabs defaultValue="orbit" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="orbit">Contribution Orbit</TabsTrigger>
                    <TabsTrigger value="activity">
                      Activity Timeline
                    </TabsTrigger>
                    <TabsTrigger value="stats">Repository Stats</TabsTrigger>
                  </TabsList>

                  <TabsContent value="orbit" className="space-y-4">
                    <div
                      ref={containerRef}
                      className="w-full h-[60vh] rounded-md border overflow-hidden relative bg-white"
                    >
                      <svg ref={svgRef} width="100%" height="100%" />
                      {/* --- Tooltip (Position Updated) --- */}
                      {tooltip.visible && (
                        <div
                          className="absolute bg-black/80 text-white text-xs rounded px-2 py-1 pointer-events-none shadow-lg whitespace-pre-wrap z-50"
                          style={{
                            // Position relative to container, add small offset
                            left: `${tooltip.x + 15}px`,
                            top: `${tooltip.y + 15}px`,
                          }}
                        >
                          {tooltip.content}
                        </div>
                      )}
                    </div>
                    {/* --- Description Text Updated --- */}
                    <div className="text-sm text-center text-muted-foreground">
                      <p>
                        Planets represent contributors (sized by Commits). Moons
                        represent commits (gray) and pull requests (purple).
                        Hover for details.
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
                          {visualizationData?.activity.timeline.map(
                            (day, i) => {
                              const maxVal = Math.max(
                                1,
                                ...visualizationData?.activity.timeline.map(
                                  (d) => d.commits
                                )
                              );
                              const heightPercent =
                                (day.commits / maxVal) * 100;
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
                                          style={{
                                            height: `${heightPercent}%`,
                                          }}
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
                            }
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between mt-2 text-xs text-slate-500 px-2">
                        {visualizationData?.activity.timeline.length &&
                          visualizationData?.activity.timeline.length > 0 && (
                            <span>
                              {visualizationData?.activity.timeline[0].date}
                            </span>
                          )}
                        {visualizationData?.activity.timeline.length &&
                          visualizationData?.activity.timeline.length > 0 && (
                            <span>
                              {
                                visualizationData?.activity.timeline.slice(
                                  -1
                                )[0].date
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
                            {visualizationData?.codebase.additions.toLocaleString()}
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
                            {visualizationData?.codebase.deletions.toLocaleString()}
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
                              visualizationData?.activity.timeline.filter(
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
                            {visualizationData?.commits.count &&
                              visualizationData?.activity.timeline.length &&
                              (
                                visualizationData?.commits.count /
                                visualizationData?.activity.timeline.length
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
                            {visualizationData?.contributors.data.map(
                              (contributor, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage
                                          src={contributor.avatar || ""}
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
                                      {contributor.commits}
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
                            {visualizationData?.codebase.byLanguage &&
                            Object.keys(visualizationData?.codebase.byLanguage)
                              .length > 0 ? (
                              <ul className="space-y-2">
                                {Object.entries(
                                  visualizationData?.codebase.byLanguage
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
                              {visualizationData?.branches.names.map(
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
