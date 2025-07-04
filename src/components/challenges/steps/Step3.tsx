/* eslint-disable react/no-unescaped-entities */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Lock, Search, AlertCircle } from "lucide-react";
import { UserData, ChallengeProgress } from "../types";
import { useDevToolsEffects } from "../hooks/useDevToolsEffects";

interface Step3Props {
  userData: UserData;
  progress: ChallengeProgress;
  hiddenInput: string;
  networkInput: string;
  consoleInput: string;
  onHiddenInputChange: (value: string) => void;
  onNetworkInputChange: (value: string) => void;
  onConsoleInputChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string;
  showHint: boolean;
  onToggleHint: () => void;
}

export function Step3({
  userData,
  progress,
  hiddenInput,
  networkInput,
  consoleInput,
  onHiddenInputChange,
  onNetworkInputChange,
  onConsoleInputChange,
  onSubmit,
  loading,
  error,
  showHint,
  onToggleHint,
}: Step3Props) {
  const isCompleted = progress.completedSteps.includes(3);
  const isActive = progress.currentStep === 3;

  // Set up DevTools effects when this step is active
  useDevToolsEffects(userData, isActive);

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
            <Search className="h-5 w-5 text-blue-500" />
          )}
          Step 3: DevTools Investigation
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
              Use your browser&apos;s Developer Tools to find three hidden
              pieces of information on this page.
            </p>

            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-blue-900 mb-2">
                DevTools Investigation Tasks:
              </h4>
              <ol className="list-decimal list-inside text-blue-800 space-y-1 text-sm">
                <li>Find the hidden element using Elements/Inspector tab</li>
                <li>Discover network data in the Network tab</li>
                <li>Locate console messages in the Console tab</li>
                <li>Submit all three pieces of evidence</li>
              </ol>
            </div>

            <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-green-900 mb-2">
                🏢 How This Skill is Used in Real Jobs
              </h4>
              <div className="text-green-800 text-sm space-y-2">
                <p>
                  <strong>Website Bug Hunter:</strong> You use browser tools to
                  find hidden problems in websites - like secret forms that
                  hackers could abuse, or hidden data that shouldn't be visible
                  to users.
                </p>
                <p>
                  <strong>Freelance Security Tester:</strong> Companies pay you
                  to find security bugs in their websites. You analyze the
                  website's code and network requests to discover problems worth
                  hundreds or thousands of dollars.
                </p>
                <p>
                  <strong>Bad Website Investigator:</strong> You examine
                  suspicious or harmful websites to understand how they work,
                  what data they steal, and how they try to trick people.
                </p>
                <p>
                  <strong>Cyber Crime Helper:</strong> When companies get hacked
                  through their websites, you help investigate by looking at
                  browser evidence, network logs, and website behavior to
                  understand what happened.
                </p>
                <p>
                  <strong>App Security Reviewer:</strong> Before websites go
                  live, you check their code using browser tools to make sure
                  the security features work correctly and can't be bypassed.
                </p>
                <p>
                  <strong>Phishing Site Tracker:</strong> You analyze fake
                  websites that try to steal passwords, tracking how they work
                  and gathering information to help shut them down.
                </p>
              </div>
            </div>

            {/* DevTools clues are dynamically created by useDevToolsEffects hook */}

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
                      <strong>Elements Tab:</strong> Look for hidden elements
                      with your user hash in the ID or data attributes
                    </p>
                    <p>
                      <strong>Network Tab:</strong> Check for XHR/Fetch requests
                      that contain clues
                    </p>
                    <p>
                      <strong>Console Tab:</strong> Look for console.log
                      messages or try running commands
                    </p>
                    <p>
                      <strong>Tip:</strong> Use Ctrl+F (Cmd+F) to search for
                      your user hash in the DevTools
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  1. Hidden Element (from Elements tab):
                </label>
                <Textarea
                  placeholder="Paste what you found in the hidden HTML element..."
                  value={hiddenInput}
                  onChange={(e) => onHiddenInputChange(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  2. Network Data (from Network tab):
                </label>
                <Textarea
                  placeholder="Paste the network request clue you discovered..."
                  value={networkInput}
                  onChange={(e) => onNetworkInputChange(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  3. Console Secret (from Console tab):
                </label>
                <Textarea
                  placeholder="Paste the console message or secret you found..."
                  value={consoleInput}
                  onChange={(e) => onConsoleInputChange(e.target.value)}
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
                !hiddenInput.trim() ||
                !networkInput.trim() ||
                !consoleInput.trim()
              }
              className="mt-4"
            >
              {loading ? "Validating..." : "Submit Step 3"}
            </Button>
          </>
        )}

        {isCompleted && (
          <div className="text-green-600">
            <p className="font-medium">✓ DevTools investigation completed!</p>
            <p className="text-sm text-gray-600 mt-1">
              Successfully found all hidden clues using browser Developer Tools.
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
