"use client";

import { useFinalTaskGrades } from "@/hooks/useFinalTaskGrades";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Target, Loader2 } from "lucide-react";

interface FinalTaskScoreCardProps {
  className?: string;
  showTitle?: boolean;
}

export function FinalTaskScoreCard({
  className = "",
  showTitle = true,
}: FinalTaskScoreCardProps) {
  const { data: gradeData, isLoading, error } = useFinalTaskGrades();

  if (isLoading) {
    return (
      <Card className={className}>
        {showTitle && (
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-yellow-600" />
              Final Project Score
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={showTitle ? "" : "pt-6"}>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !gradeData) {
    return (
      <Card className={className}>
        {showTitle && (
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-yellow-600" />
              Final Project Score
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={showTitle ? "" : "pt-6"}>
          <div className="text-center py-6 text-slate-500">
            <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No final project data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { totalPointsEarned, totalTasksGraded, totalTasks } = gradeData;

  return (
    <Card
      className={`${className} bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200`}
    >
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-yellow-800">
            <Award className="h-5 w-5 text-yellow-600" />
            Final Project Score
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={showTitle ? "" : "pt-6"}>
        <div className="space-y-4">
          {/* Main Score Display */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="text-3xl font-bold text-yellow-800">
                {totalPointsEarned}
              </div>
              <div className="text-lg text-yellow-600">points</div>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-yellow-700">
              <Target className="h-4 w-4" />
              <span>
                {totalTasksGraded} of {totalTasks} tasks graded
              </span>
            </div>
          </div>

          {/* Stats Display */}
          <div className="flex justify-center">
            <div className="bg-white/60 rounded-lg p-4 text-center">
              <div className="text-xl font-semibold text-yellow-800">
                {totalTasksGraded}
              </div>
              <div className="text-sm text-yellow-600">Graded Tasks</div>
            </div>
          </div>

          {/* Progress Indicator */}
          {totalTasks > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-yellow-700">
                <span>Progress</span>
                <span>
                  {Math.round((totalTasksGraded / totalTasks) * 100)}%
                </span>
              </div>
              <div className="w-full bg-yellow-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      (totalTasksGraded / totalTasks) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex justify-center">
            {totalTasksGraded === 0 ? (
              <Badge
                variant="outline"
                className="text-yellow-700 border-yellow-300"
              >
                No tasks graded yet
              </Badge>
            ) : totalTasksGraded === totalTasks ? (
              <Badge className="bg-green-100 text-green-800 border-green-300">
                All tasks graded!
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-yellow-700 border-yellow-300"
              >
                {totalTasks - totalTasksGraded} tasks pending
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
