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
      const trunkBaseY = height - 10;
      const trunkHeight = 110;
      const trunkTopY = trunkBaseY - trunkHeight;
      const trunkWidthAtBase = 45;
      const trunkWidthAtTop = 28;
      const rootFlairFactor = 0.4;
      const branchAngleSpread = Math.PI * 0.85;
      const startAngle = -Math.PI / 2 - branchAngleSpread / 2;
      const minBranchLength = 60;
      const maxBranchLengthAddition = 150;
      const textOffset = 22;

      const trunkColor = "#8B4513";
      const branchColor = "#A0522D";
      const branchStrokeColor = "#6B4423";
      const leafColors = [
        "#55a630",
        "#80b918",
        "#aacc00",
        "#bfd200",
        "#d4d700",
        "#6b9127",
        "#9dbd3c",
        "#448a20",
      ];
      const textFill = "#1e293b";

      const defs = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "defs"
      );

      const filter = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "filter"
      );
      filter.setAttribute("id", "subtle-texture");
      filter.setAttribute("x", "0");
      filter.setAttribute("y", "0");
      filter.setAttribute("width", "100%");
      filter.setAttribute("height", "100%");
      const turbulence = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "feTurbulence"
      );
      turbulence.setAttribute("type", "fractalNoise");
      turbulence.setAttribute("baseFrequency", "0.03 0.06");
      turbulence.setAttribute("numOctaves", "2");
      turbulence.setAttribute("seed", `${Math.random() * 100}`);
      turbulence.setAttribute("result", "noise");
      filter.appendChild(turbulence);
      const displace = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "feDisplacementMap"
      );
      displace.setAttribute("in", "SourceGraphic");
      displace.setAttribute("in2", "noise");
      displace.setAttribute("scale", "2");
      displace.setAttribute("xChannelSelector", "R");
      displace.setAttribute("yChannelSelector", "G");
      filter.appendChild(displace);
      const blur = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "feGaussianBlur"
      );
      blur.setAttribute("stdDeviation", "0.5");
      filter.appendChild(blur);
      defs.appendChild(filter);

      leafColors.forEach((color, index) => {
        const grad = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "radialGradient"
        );
        grad.setAttribute("id", `leafGrad${index}`);
        grad.setAttribute("cx", "30%");
        grad.setAttribute("cy", "30%");
        grad.setAttribute("r", "70%");

        const stop1 = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "stop"
        );
        stop1.setAttribute("offset", "0%");
        stop1.setAttribute("stop-color", "#ffffff");
        stop1.setAttribute("stop-opacity", "0.3");
        grad.appendChild(stop1);

        const stop2 = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "stop"
        );
        stop2.setAttribute("offset", "100%");
        stop2.setAttribute("stop-color", color);
        grad.appendChild(stop2);
        defs.appendChild(grad);
      });

      svg.appendChild(defs);

      const trunkPath = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      const rootFlairOffset = trunkWidthAtBase * rootFlairFactor;
      trunkPath.setAttribute(
        "d",
        `M ${centerX - trunkWidthAtBase / 2 - rootFlairOffset} ${trunkBaseY} ` +
          `C ${centerX - trunkWidthAtBase / 2 - rootFlairOffset * 0.5} ${
            trunkBaseY - trunkHeight * 0.1
          }, ` +
          `${centerX - trunkWidthAtBase / 2.5} ${
            trunkBaseY - trunkHeight * 0.25
          }, ` +
          `${centerX - trunkWidthAtBase / 2} ${
            trunkBaseY - trunkHeight * 0.3
          } ` +
          `C ${centerX - trunkWidthAtBase / 3} ${
            trunkBaseY - trunkHeight * 0.6
          }, ` +
          `${centerX - trunkWidthAtTop / 1.5} ${
            trunkTopY + trunkHeight * 0.3
          }, ` +
          `${centerX - trunkWidthAtTop / 2} ${trunkTopY} ` +
          `L ${centerX + trunkWidthAtTop / 2} ${trunkTopY} ` +
          `C ${centerX + trunkWidthAtTop / 1.5} ${
            trunkTopY + trunkHeight * 0.3
          }, ` +
          `${centerX + trunkWidthAtBase / 3} ${
            trunkBaseY - trunkHeight * 0.6
          }, ` +
          `${centerX + trunkWidthAtBase / 2} ${
            trunkBaseY - trunkHeight * 0.3
          } ` +
          `C ${centerX + trunkWidthAtBase / 2.5} ${
            trunkBaseY - trunkHeight * 0.25
          }, ` +
          `${centerX + trunkWidthAtBase / 2 + rootFlairOffset * 0.5} ${
            trunkBaseY - trunkHeight * 0.1
          }, ` +
          `${centerX + trunkWidthAtBase / 2 + rootFlairOffset} ${trunkBaseY} Z`
      );
      trunkPath.setAttribute("fill", trunkColor);
      trunkPath.setAttribute("stroke", branchStrokeColor);
      trunkPath.setAttribute("stroke-width", "1");
      trunkPath.setAttribute("filter", "url(#subtle-texture)");
      svg.appendChild(trunkPath);

      const contributors = visData.contributors.data;
      if (!contributors || contributors.length === 0) return;

      const maxContributions = Math.max(
        1,
        ...contributors.map((c) => c.contributions || 0)
      );
      const totalContributors = contributors.length;

      const branchesGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );
      const leavesGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );
      const textGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );
      svg.appendChild(branchesGroup);
      svg.appendChild(leavesGroup);
      svg.appendChild(textGroup);

      contributors.forEach((contributor, index) => {
        const contributionRatio =
          maxContributions > 0
            ? (contributor.contributions || 0) / maxContributions
            : 0;
        const branchLength =
          minBranchLength + contributionRatio * maxBranchLengthAddition;
        const angleVariance =
          (Math.random() - 0.5) *
          (branchAngleSpread / (totalContributors * 2.5));
        const angle =
          startAngle +
          (branchAngleSpread / (totalContributors + 1)) * (index + 1) +
          angleVariance;
        const branchStartX =
          centerX + (Math.random() - 0.5) * (trunkWidthAtTop * 0.4);
        const branchStartY = trunkTopY + 5 + Math.random() * 10;
        const endX = branchStartX + Math.cos(angle) * branchLength;
        const endY = branchStartY + Math.sin(angle) * branchLength;
        const controlX1 =
          branchStartX + Math.cos(angle + 0.1) * branchLength * 0.3;
        const controlY1 =
          branchStartY + Math.sin(angle + 0.1) * branchLength * 0.3;
        const controlX2 =
          branchStartX + Math.cos(angle - 0.1) * branchLength * 0.7;
        const controlY2 =
          branchStartY + Math.sin(angle - 0.1) * branchLength * 0.7;
        const branchWidthStart = Math.max(
          5,
          16 * (0.4 + contributionRatio * 0.6)
        );
        const branchWidthEnd = Math.max(2.5, branchWidthStart * 0.3);
        const anglePerp = angle + Math.PI / 2;
        const endOffsetX = (Math.cos(anglePerp) * branchWidthEnd) / 2;
        const endOffsetY = (Math.sin(anglePerp) * branchWidthEnd) / 2;

        const branch = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        branch.setAttribute(
          "d",
          `M ${branchStartX - (Math.cos(anglePerp) * branchWidthStart) / 2} ${
            branchStartY - (Math.sin(anglePerp) * branchWidthStart) / 2
          } ` +
            `C ${controlX1 - Math.cos(anglePerp) * branchWidthStart * 0.3} ${
              controlY1 - Math.sin(anglePerp) * branchWidthStart * 0.3
            }, ` +
            `${controlX2 - Math.cos(anglePerp) * branchWidthEnd * 0.6} ${
              controlY2 - Math.sin(anglePerp) * branchWidthEnd * 0.6
            }, ` +
            `${endX - endOffsetX} ${endY - endOffsetY} ` +
            `A ${branchWidthEnd / 2} ${branchWidthEnd / 2} 0 0 1 ${
              endX + endOffsetX
            } ${endY + endOffsetY} ` +
            `C ${controlX2 + Math.cos(anglePerp) * branchWidthEnd * 0.6} ${
              controlY2 + Math.sin(anglePerp) * branchWidthEnd * 0.6
            }, ` +
            `${controlX1 + Math.cos(anglePerp) * branchWidthStart * 0.3} ${
              controlY1 + Math.sin(anglePerp) * branchWidthStart * 0.3
            }, ` +
            `${branchStartX + (Math.cos(anglePerp) * branchWidthStart) / 2} ${
              branchStartY + (Math.sin(anglePerp) * branchWidthStart) / 2
            } ` +
            `Z`
        );
        branch.setAttribute("fill", branchColor);
        branch.setAttribute("stroke", branchStrokeColor);
        branch.setAttribute("stroke-width", "0.75");
        branch.setAttribute("filter", "url(#subtle-texture)");

        const branchTitle = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "title"
        );
        branchTitle.textContent = `${
          contributor.displayName || contributor.username
        }: ${contributor.contributions} commits`;
        branch.appendChild(branchTitle);
        branchesGroup.appendChild(branch);

        const commits = visData.commits.byAuthor[contributor.username] || 0;
        const numTwigs = Math.max(1, Math.min(3, Math.floor(commits / 10)));
        const baseLeafCountPerCommit = 3.5;
        const maxTotalLeaves = 200;
        const totalLeavesForBranch = Math.min(
          maxTotalLeaves,
          10 + Math.floor(commits * baseLeafCountPerCommit)
        );

        for (let t = 0; t < numTwigs; t++) {
          const twigStartRatio = 0.3 + Math.random() * 0.6;
          const twigStartX =
            branchStartX + Math.cos(angle) * branchLength * twigStartRatio;
          const twigStartY =
            branchStartY + Math.sin(angle) * branchLength * twigStartRatio;
          const twigAngleVariance = (Math.random() - 0.5) * 1.2;
          const twigAngle = angle + twigAngleVariance;
          const twigLength = branchLength * (0.15 + Math.random() * 0.25);
          const twigEndX = twigStartX + Math.cos(twigAngle) * twigLength;
          const twigEndY = twigStartY + Math.sin(twigAngle) * twigLength;
          const twigWidth = Math.max(1.5, branchWidthEnd * 0.6);

          const twig = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
          );
          twig.setAttribute("x1", `${twigStartX}`);
          twig.setAttribute("y1", `${twigStartY}`);
          twig.setAttribute("x2", `${twigEndX}`);
          twig.setAttribute("y2", `${twigEndY}`);
          twig.setAttribute("stroke", branchColor);
          twig.setAttribute("stroke-width", `${twigWidth}`);
          twig.setAttribute("stroke-linecap", "round");
          branchesGroup.appendChild(twig);

          const leavesOnThisTwig = Math.floor(totalLeavesForBranch / numTwigs);
          for (let i = 0; i < leavesOnThisTwig; i++) {
            const leafDistanceRatio = 0.1 + Math.random() * 0.9;
            const leafDist = twigLength * leafDistanceRatio;
            const leafAngleVariance = (Math.random() - 0.5) * 0.5;
            const placementAngle = twigAngle + leafAngleVariance;
            const leafBaseX = twigStartX + Math.cos(placementAngle) * leafDist;
            const leafBaseY = twigStartY + Math.sin(placementAngle) * leafDist;

            const leafSize = 4 + Math.pow(Math.random(), 1.5) * 7;
            const leafWidth = leafSize * (0.3 + Math.random() * 0.4);
            const leafRotation =
              twigAngle * (180 / Math.PI) + 90 + (Math.random() - 0.5) * 75;
            const leafColorIndex = Math.floor(
              Math.random() * leafColors.length
            );

            const leaf = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path"
            );
            let dPath = "";
            const shapeType = Math.random();
            if (shapeType < 0.6) {
              dPath = `M 0 0 Q ${leafWidth / 2} ${
                -leafSize / 2
              }, 0 ${-leafSize} Q ${-leafWidth / 2} ${-leafSize / 2}, 0 0 Z`;
            } else if (shapeType < 0.85) {
              dPath = `M 0 0 Q ${leafWidth / 1.5} ${
                -leafSize / 2.5
              }, 0 ${-leafSize} Q ${-leafWidth / 1.5} ${
                -leafSize / 2.5
              }, 0 0 Z`;
            } else {
              dPath = `M 0 0 Q ${leafWidth * 0.8} ${
                -leafSize * 0.4
              }, 0 ${-leafSize} Q ${-leafWidth * 0.8} ${
                -leafSize * 0.4
              }, 0 0 Z`;
            }
            leaf.setAttribute("d", dPath);
            leaf.setAttribute("fill", `url(#leafGrad${leafColorIndex})`);
            leaf.setAttribute("fill-opacity", `${0.65 + Math.random() * 0.3}`);
            leaf.setAttribute("stroke", "#16302b");
            leaf.setAttribute("stroke-width", "0.2");
            leaf.setAttribute(
              "transform",
              `translate(${leafBaseX} ${leafBaseY}) rotate(${leafRotation})`
            );

            leavesGroup.appendChild(leaf);
          }
        }

        const text = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        const textAngle = angle;
        const textRadius = branchLength + textOffset;
        const textX = centerX + Math.cos(textAngle) * textRadius;
        const textY = trunkTopY + Math.sin(textAngle) * textRadius;

        text.setAttribute("x", `${textX}`);
        text.setAttribute("y", `${textY}`);
        text.setAttribute("dy", "0.35em");
        text.setAttribute("fill", textFill);
        text.setAttribute("font-size", "11px");
        text.setAttribute("font-family", "'Inter', sans-serif");
        text.setAttribute("font-weight", "600");
        text.textContent = contributor.displayName || contributor.username;

        const normalizedAngle = (angle + Math.PI * 2) % (Math.PI * 2);
        if (
          normalizedAngle > Math.PI * 0.1 &&
          normalizedAngle < Math.PI * 0.9
        ) {
          text.setAttribute("text-anchor", "start");
        } else if (
          normalizedAngle > Math.PI * 1.1 &&
          normalizedAngle < Math.PI * 1.9
        ) {
          text.setAttribute("text-anchor", "end");
        } else {
          text.setAttribute("text-anchor", "middle");
        }

        text.setAttribute("stroke", "#ffffff");
        text.setAttribute("stroke-width", "2.5");
        text.setAttribute("stroke-linejoin", "round");
        text.setAttribute("paint-order", "stroke");

        textGroup.appendChild(text);
      });

      const title = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      title.setAttribute("x", `${centerX}`);
      title.setAttribute("y", "30");
      title.setAttribute("text-anchor", "middle");
      title.setAttribute("font-size", "20px");
      title.setAttribute("font-family", "'Inter', sans-serif");
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
