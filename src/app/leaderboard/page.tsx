"use client";

import { useLeaderboardData } from "@/hooks/useGrades";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, User, Award, Trophy, Medal } from "lucide-react";
import { Profile } from "@/db/drizzle/schema";
import { GradeWithProfilesType } from "@/db/drizzle/schema";

// Helper component for rank icons
const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
  if (rank === 3) return <Award className="h-5 w-5 text-orange-600" />;
  return <span className="text-sm font-medium w-5 text-center">{rank}</span>;
};

export default function LeaderboardPage() {
  const { data: topStudents, isLoading } = useLeaderboardData() as {
    data: GradeWithProfilesType[] | undefined;
    isLoading: boolean;
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight text-center mb-2">
          Leaderboard
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Top 10 students based on total points earned.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>
              Ranking based on quiz, assignment, extra, and final project points
              (max 400).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !topStudents || topStudents.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No student data available yet.
              </div>
            ) : (
              <div className="space-y-4">
                {topStudents.map((student, index) => {
                  const profile = student.user?.profiles?.[0] as
                    | Profile
                    | undefined;
                  const rank = index + 1;

                  return (
                    <div
                      key={student.userId}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        rank === 1
                          ? "bg-yellow-50 border border-yellow-200"
                          : rank === 2
                          ? "bg-slate-50 border border-slate-200"
                          : rank === 3
                          ? "bg-orange-50 border border-orange-200"
                          : "border"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <RankIcon rank={rank} />
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={profile?.avatarUrl || ""}
                            alt={profile?.fullName || "Student"}
                          />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {profile?.fullName || "Unknown Student"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {profile?.email || "No email"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg">
                          {student.totalPoints ?? 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total Points
                        </div>
                        {(student as any).basePoints !== undefined && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Base: {(student as any).basePoints} + Final:{" "}
                            {(student as any).finalProjectPoints || 0}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
