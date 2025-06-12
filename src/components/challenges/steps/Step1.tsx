import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  Lock,
  Key,
  Eye,
  EyeOff,
  Copy,
  AlertCircle,
} from "lucide-react";
import { UserData, ChallengeProgress } from "../types";
import { copyToClipboard } from "../utils/clipboard";

interface Step1Props {
  userData: UserData;
  progress: ChallengeProgress;
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string;
  showJwtToken: boolean;
  onToggleJwtToken: () => void;
  showHint: boolean;
  onToggleHint: () => void;
}

export function Step1({
  userData,
  progress,
  input,
  onInputChange,
  onSubmit,
  loading,
  error,
  showJwtToken,
  onToggleJwtToken,
  showHint,
  onToggleHint,
}: Step1Props) {
  const isCompleted = progress.completedSteps.includes(1);
  const isActive = progress.currentStep === 1;

  return (
    <Card
      className={`${
        isCompleted
          ? "border-green-500"
          : isActive
          ? "border-blue-500"
          : "border-gray-200"
      }`}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isCompleted ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <Key className="h-5 w-5 text-blue-500" />
          )}
          Step 1: JWT Token Analysis
          {isCompleted && <Badge variant="secondary">Completed</Badge>}
          {!isActive && !isCompleted && (
            <Lock className="h-4 w-4 text-gray-400" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isActive && (
          <>
            <p className="text-gray-700 mb-4">
              You&apos;ve been given a JWT token. Decode it to find the hidden
              message and paste the payload content below.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Your JWT Token:</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(userData.jwtToken)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onToggleJwtToken}
                  >
                    {showJwtToken ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <code className="text-sm break-all">
                {showJwtToken ? userData.jwtToken : "•".repeat(50)}
              </code>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onToggleHint}
              className="mb-4"
            >
              {showHint ? "Hide Hint" : "Show Hint"}
            </Button>

            {showHint && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Use jwt.io to decode the token. Copy the entire payload and
                  paste it below.
                </AlertDescription>
              </Alert>
            )}

            <Textarea
              placeholder="Paste the decoded JWT payload here..."
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              className="mb-4"
              rows={6}
            />

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button onClick={onSubmit} disabled={loading || !input.trim()}>
              {loading ? "Validating..." : "Submit Step 1"}
            </Button>
          </>
        )}

        {isCompleted && (
          <div className="text-green-600">
            <p className="font-medium">✓ JWT successfully decoded!</p>
            <p className="text-sm text-gray-600 mt-1">
              Message: {progress.step1Data.decodedMessage}
            </p>
          </div>
        )}

        {!isActive && !isCompleted && (
          <p className="text-gray-500">
            Complete previous steps to unlock this challenge.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
