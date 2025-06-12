import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Trophy } from "lucide-react";
import Link from "next/link";
import { ChallengeProgress } from "./types";

interface ChallengeHeaderProps {
  progress: ChallengeProgress;
}

export function ChallengeHeader({ progress }: ChallengeHeaderProps) {
  const progressPercentage = (progress.completedSteps.length / 5) * 100;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/challenges">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Challenges
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span className="font-medium">Security Challenge</span>
        </div>
      </div>

      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">
          Multi-Step Security Challenge
        </h1>
        <p className="text-gray-600">
          Complete all 5 steps to master web security fundamentals
        </p>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{progress.completedSteps.length}/5 steps completed</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>
    </div>
  );
}
