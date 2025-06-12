/* eslint-disable react/no-unescaped-entities */
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

            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-blue-900 mb-2">
                JWT Analysis Tasks:
              </h4>
              <ol className="list-decimal list-inside text-blue-800 space-y-1 text-sm">
                <li>
                  Decode the JWT token using jwt.io or manual base64 decoding
                </li>
                <li>Extract the payload information</li>
                <li>Submit the decoded payload content</li>
              </ol>
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

            <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4 mt-4">
              <h4 className="font-medium text-green-900 mb-2">
                🏢 How This Skill is Used in Real Jobs
              </h4>
              <div className="text-green-800 text-sm space-y-2">
                <p>
                  <strong>Website Security Tester:</strong> Companies hire
                  people to check if their login systems are secure. You'd look
                  at JWT tokens to see if they accidentally show private
                  information like passwords or personal data.
                </p>
                <p>
                  <strong>Bug Hunter (Freelance):</strong> You can earn money by
                  finding security problems in websites. Many companies pay
                  $500-$5,000+ when you find issues with their login tokens.
                </p>
                <p>
                  <strong>IT Security Helper:</strong> When a company gets
                  hacked, you help figure out what happened by examining the
                  login records and tokens to trace the attack.
                </p>
                <p>
                  <strong>App Security Checker:</strong> Before companies
                  release their mobile apps or websites, you test if the login
                  system can be broken or bypassed by analyzing the tokens.
                </p>
                <p>
                  <strong>Privacy Compliance:</strong> You help companies follow
                  privacy laws (like GDPR in Europe) by making sure their tokens
                  don't accidentally leak personal information.
                </p>
              </div>
            </div>
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
