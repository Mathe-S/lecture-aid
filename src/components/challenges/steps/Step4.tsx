/* eslint-disable react/no-unescaped-entities */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Lock, Server, AlertCircle, Copy } from "lucide-react";
import { UserData, ChallengeProgress } from "../types";
import { copyToClipboard } from "../utils/clipboard";

interface Step4Props {
  userData: UserData;
  progress: ChallengeProgress;
  apiInput: string;
  authInput: string;
  endpointInput: string;
  onApiInputChange: (value: string) => void;
  onAuthInputChange: (value: string) => void;
  onEndpointInputChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string;
  showHint: boolean;
  onToggleHint: () => void;
}

export function Step4({
  userData,
  progress,
  apiInput,
  authInput,
  endpointInput,
  onApiInputChange,
  onAuthInputChange,
  onEndpointInputChange,
  onSubmit,
  loading,
  error,
  showHint,
  onToggleHint,
}: Step4Props) {
  const isCompleted = progress.completedSteps.includes(4);
  const isActive = progress.currentStep === 4;

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
            <Server className="h-5 w-5 text-blue-500" />
          )}
          Step 4: API Testing & Authentication
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
              Test API endpoints with proper authentication. Use the provided
              credentials to make authenticated requests.
            </p>

            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-blue-900 mb-2">
                API Testing Tasks:
              </h4>
              <ol className="list-decimal list-inside text-blue-800 space-y-1 text-sm">
                <li>Make a request to the API endpoint with authentication</li>
                <li>Capture the API response</li>
                <li>Record the authentication token used</li>
                <li>Document the endpoint URL</li>
              </ol>
            </div>

            <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-green-900 mb-2">
                🏢 How This Skill is Used in Real Jobs
              </h4>
              <div className="text-green-800 text-sm space-y-2">
                <p>
                  <strong>API Security Tester:</strong> Many websites use APIs
                  (like services that apps talk to). You test these to make sure
                  only authorized users can access them and that they don't leak
                  private information.
                </p>
                <p>
                  <strong>Bug Bounty Hunter:</strong> You can earn money by
                  finding problems in company APIs - like when you can access
                  other users' data or perform actions you shouldn't be allowed
                  to do.
                </p>
                <p>
                  <strong>Automated Security Checker:</strong> You set up
                  systems that automatically test APIs every time developers
                  make changes, catching security problems before the website
                  goes live.
                </p>
                <p>
                  <strong>Privacy Law Helper:</strong> You check that APIs
                  follow privacy rules (like asking permission before collecting
                  data) and meet legal requirements for handling personal
                  information.
                </p>
                <p>
                  <strong>Incident Response Specialist:</strong> When APIs get
                  abused or hacked, you investigate the logs to understand what
                  data was accessed and help stop the attack.
                </p>
                <p>
                  <strong>Ethical Hacker:</strong> Companies hire you to pretend
                  to be a bad guy and try to break their APIs, helping them find
                  and fix security problems before real attackers do.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">API Endpoint:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(userData.apiEndpoint)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <code className="text-sm break-all bg-white p-2 rounded border block">
                  {userData.apiEndpoint}
                </code>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Auth Token:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(userData.authToken)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <code className="text-sm break-all bg-white p-2 rounded border block">
                  {userData.authToken}
                </code>
              </div>
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
                      <strong>Using curl:</strong>
                    </p>
                    <code className="block bg-gray-100 p-2 rounded text-sm">
                      curl -X POST {userData.apiEndpoint} \<br />
                      &nbsp;&nbsp;-H &quot;Authorization: {userData.authToken}
                      &quot; \
                      <br />
                      &nbsp;&nbsp;-H &quot;Content-Type: application/json&quot;
                      \<br />
                      &nbsp;&nbsp;-d '{`{"action": "validate"}`}'
                    </code>
                    <p>
                      <strong>Using Postman/Insomnia:</strong> Set Authorization
                      header and make a POST request
                    </p>
                    <p>
                      <strong>Using Browser DevTools:</strong> Use the fetch()
                      function in the console
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  1. API Response (JSON):
                </label>
                <Textarea
                  placeholder="Paste the complete API response here..."
                  value={apiInput}
                  onChange={(e) => onApiInputChange(e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  2. Authentication Token Used:
                </label>
                <Textarea
                  placeholder="Paste the authorization header or token you used..."
                  value={authInput}
                  onChange={(e) => onAuthInputChange(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  3. Endpoint URL:
                </label>
                <Textarea
                  placeholder="Paste the complete endpoint URL you called..."
                  value={endpointInput}
                  onChange={(e) => onEndpointInputChange(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="whitespace-pre-line">{error}</div>
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={onSubmit}
              disabled={
                loading ||
                !apiInput.trim() ||
                !authInput.trim() ||
                !endpointInput.trim()
              }
              className="mt-4"
            >
              {loading ? "Validating..." : "Submit Step 4"}
            </Button>
          </>
        )}

        {isCompleted && (
          <div className="text-green-600">
            <p className="font-medium">✓ API testing completed!</p>
            <p className="text-sm text-gray-600 mt-1">
              Successfully made authenticated API requests and documented the
              process.
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
