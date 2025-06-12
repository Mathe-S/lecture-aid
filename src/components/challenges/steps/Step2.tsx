/* eslint-disable react/no-unescaped-entities */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Lock, Github, Copy, AlertCircle } from "lucide-react";
import { UserData, ChallengeProgress } from "../types";
import { copyToClipboard } from "../utils/clipboard";

interface Step2Props {
  userData: UserData;
  progress: ChallengeProgress;
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string;
  showHint: boolean;
  onToggleHint: () => void;
}

export function Step2({
  userData,
  progress,
  input,
  onInputChange,
  onSubmit,
  loading,
  error,
  showHint,
  onToggleHint,
}: Step2Props) {
  const isCompleted = progress.completedSteps.includes(2);
  const isActive = progress.currentStep === 2;

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
            <Github className="h-5 w-5 text-blue-500" />
          )}
          Step 2: Repository Investigation & JWT Creation
          {isCompleted && <Badge variant="secondary">Completed</Badge>}
          {!isActive && !isCompleted && (
            <Lock className="h-4 w-4 text-gray-400" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isActive && (
          <>
            <p className="text-gray-700">
              Use the clue from Step 1 to find the configuration file in the
              KIU-lecture-aid repository:{" "}
              <a
                href="https://github.com/Mathe-S/lecture-aid"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                https://github.com/Mathe-S/lecture-aid
              </a>
            </p>

            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-blue-900 mb-2">
                Repository Investigation Tasks:
              </h4>
              <ol className="list-decimal list-inside text-blue-800 space-y-1 text-sm">
                <li>Find the challenge configuration file in the repository</li>
                <li>Create a JWT token using the config as payload</li>
                <li>Sign the JWT with your User ID as the secret</li>
                <li>Submit the properly signed JWT token</li>
              </ol>
            </div>

            <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-green-900 mb-2">
                🏢 How This Skill is Used in Real Jobs
              </h4>
              <div className="text-green-800 text-sm space-y-2">
                <p>
                  <strong>Code Security Checker:</strong> Companies need people
                  to look through their code repositories (like GitHub) to find
                  accidentally uploaded passwords, API keys, or secret files
                  that hackers could use.
                </p>
                <p>
                  <strong>Software Safety Inspector:</strong> Before using
                  third-party code libraries, companies hire people to check if
                  they contain viruses, backdoors, or security problems that
                  could harm their systems.
                </p>
                <p>
                  <strong>Digital Detective:</strong> When something goes wrong
                  with a company's code, you investigate the history of changes
                  to find out who did what and when, helping solve security
                  incidents.
                </p>
                <p>
                  <strong>Ethical Hacker:</strong> Companies pay you to think
                  like a bad guy and find information about them online (like in
                  their public code) that real hackers might use to attack them.
                </p>
                <p>
                  <strong>Login System Builder:</strong> You design and build
                  secure login systems for websites and apps, making sure the
                  tokens can't be faked or stolen by attackers.
                </p>
                <p>
                  <strong>Security Code Validator:</strong> You check if the
                  mathematical security (cryptography) in login systems is
                  implemented correctly and can't be easily broken.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">
                  Your User ID (use as secret):
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(userData.userId)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <code className="text-sm break-all bg-white p-2 rounded border">
                {userData.userId}
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
                  <div className="space-y-2">
                    <p>
                      1. Navigate to the GitHub repository and find
                      challenge-config.json
                    </p>
                    <p>2. Copy the entire JSON content</p>
                    <p>3. Go to jwt.io and paste the JSON as the payload</p>
                    <p>
                      4. Use your User ID as the secret (verify signature
                      section)
                    </p>
                    <p>5. Make sure algorithm is HS256</p>
                    <p>6. Copy the complete JWT token and submit it</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Textarea
              placeholder="Paste your created JWT token here..."
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              className="mb-4"
              rows={4}
            />

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button onClick={onSubmit} disabled={loading || !input.trim()}>
              {loading ? "Validating..." : "Submit Step 2"}
            </Button>
          </>
        )}

        {isCompleted && (
          <div className="text-green-600">
            <p className="font-medium">
              ✓ Repository investigated and JWT created!
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Found configuration file and created valid JWT token.
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
