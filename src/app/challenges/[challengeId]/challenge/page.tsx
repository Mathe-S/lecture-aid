"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  CheckCircle,
  Lock,
  Unlock,
  Key,
  Github,
  Trophy,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  Search,
  Server,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

interface ChallengeProgress {
  currentStep: number;
  completedSteps: number[];
  step1Data: { decodedMessage: string; jwtPayload: any; submitted: boolean };
  step2Data: { foundKey: string; repositoryUrl: string; submitted: boolean };
  step3Data: {
    hiddenClue: string;
    networkData: string;
    consoleSecret: string;
    submitted: boolean;
  };
  step4Data: {
    apiResponse: string;
    authToken: string;
    endpointUrl: string;
    submitted: boolean;
  };
  step5Data: {
    encryptedMessage: string;
    originalMessage: string;
    submitted: boolean;
  };
}

export default function ChallengeInterface() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const challengeId = params.challengeId as string;

  // Challenge state
  const [progress, setProgress] = useState<ChallengeProgress>({
    currentStep: 1,
    completedSteps: [],
    step1Data: { decodedMessage: "", jwtPayload: null, submitted: false },
    step2Data: { foundKey: "", repositoryUrl: "", submitted: false },
    step3Data: {
      hiddenClue: "",
      networkData: "",
      consoleSecret: "",
      submitted: false,
    },
    step4Data: {
      apiResponse: "",
      authToken: "",
      endpointUrl: "",
      submitted: false,
    },
    step5Data: { encryptedMessage: "", originalMessage: "", submitted: false },
  });

  // Form states
  const [inputs, setInputs] = useState({
    step1: "",
    step2: "",
    step3Hidden: "",
    step3Network: "",
    step3Console: "",
    step4Api: "",
    step4Auth: "",
    step4Endpoint: "",
    step5Message: "",
    step5Encrypted: "",
  });

  // UI states
  const [showJwtToken, setShowJwtToken] = useState(false);
  const [showHints, setShowHints] = useState({
    step1: false,
    step2: false,
    step3: false,
    step4: false,
    step5: false,
  });
  const [loading, setLoading] = useState({
    step1: false,
    step2: false,
    step3: false,
    step4: false,
    step5: false,
  });
  const [errors, setErrors] = useState({
    step1: "",
    step2: "",
    step3: "",
    step4: "",
    step5: "",
  });

  // Generate user-specific data - memoized to prevent infinite re-renders
  const userData = useMemo(() => {
    if (!user) return null;

    const userId = user.id;
    const userHash = btoa(userId).slice(0, 8);

    const payload = {
      user_id: userId,
      message: `Step 1 complete! For step 2, find file 'config-${userHash}.json' in the KIU-lecture-aid repository under /assets/challenge-data/. This contains your DevTools clue.`,
      step: 2,
      timestamp: Date.now(),
    };

    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payloadEncoded = btoa(JSON.stringify(payload));
    const signature = btoa(`signature_${userHash}`);
    const jwtToken = `${header}.${payloadEncoded}.${signature}`;
    const jwtKey = `secret_${userHash}`;

    const devToolsClue = `DevTools-Clue-${userHash}: Check the Network tab for XHR requests to /api/challenge/step3`;
    const apiEndpoint = `/api/challenge/validate/${userHash}`;
    const authToken = `Bearer auth_${userHash}_token`;

    return { jwtToken, jwtKey, userHash, devToolsClue, apiEndpoint, authToken };
  }, [user]);

  // Load progress from localStorage
  useEffect(() => {
    if (user && userData) {
      const saved = localStorage.getItem(`challenge_${challengeId}_${user.id}`);
      if (saved) setProgress(JSON.parse(saved));
    }
  }, [user, challengeId, userData]);

  // Save progress
  const saveProgress = (newProgress: ChallengeProgress) => {
    if (user) {
      localStorage.setItem(
        `challenge_${challengeId}_${user.id}`,
        JSON.stringify(newProgress)
      );
      setProgress(newProgress);
    }
  };

  // Step handlers
  const handleStep1Submit = async () => {
    if (!userData) return;
    setLoading((prev) => ({ ...prev, step1: true }));
    setErrors((prev) => ({ ...prev, step1: "" }));

    try {
      // Decode the JWT payload to get the expected content
      const parts = userData.jwtToken.split(".");
      const payload = JSON.parse(atob(parts[1]));

      // Check if the input contains elements from the decoded JWT payload
      const hasMessage = inputs.step1.includes(payload.message);
      const hasUserId = inputs.step1.includes(payload.user_id);
      const hasStep = inputs.step1.includes(payload.step.toString());

      if (hasMessage && hasUserId && hasStep) {
        saveProgress({
          ...progress,
          currentStep: 2,
          completedSteps: [...progress.completedSteps, 1],
          step1Data: {
            decodedMessage: payload.message,
            jwtPayload: payload,
            submitted: true,
          },
        });
      } else {
        setErrors((prev) => ({
          ...prev,
          step1:
            "Invalid JWT decode. Please decode the JWT token and paste the payload content.",
        }));
      }
    } catch {
      setErrors((prev) => ({ ...prev, step1: "Error processing submission." }));
    }
    setLoading((prev) => ({ ...prev, step1: false }));
  };

  const handleStep2Submit = async () => {
    if (!userData) return;
    setLoading((prev) => ({ ...prev, step2: true }));
    setErrors((prev) => ({ ...prev, step2: "" }));

    try {
      if (
        inputs.step2.includes(userData.userHash) &&
        inputs.step2.includes("config-")
      ) {
        saveProgress({
          ...progress,
          currentStep: 3,
          completedSteps: [...progress.completedSteps, 2],
          step2Data: {
            foundKey: inputs.step2,
            repositoryUrl: "https://github.com/KIU-lecture-aid",
            submitted: true,
          },
        });
      } else {
        setErrors((prev) => ({
          ...prev,
          step2:
            "Invalid config file. Find the correct file for your user hash.",
        }));
      }
    } catch {
      setErrors((prev) => ({ ...prev, step2: "Error processing submission." }));
    }
    setLoading((prev) => ({ ...prev, step2: false }));
  };

  const handleStep3Submit = async () => {
    if (!userData) return;
    setLoading((prev) => ({ ...prev, step3: true }));
    setErrors((prev) => ({ ...prev, step3: "" }));

    try {
      const hasHidden = inputs.step3Hidden.includes(userData.userHash);
      const hasNetwork = inputs.step3Network.includes("/api/challenge/step3");
      const hasConsole = inputs.step3Console.includes("DevTools-Clue");

      if (hasHidden && hasNetwork && hasConsole) {
        saveProgress({
          ...progress,
          currentStep: 4,
          completedSteps: [...progress.completedSteps, 3],
          step3Data: {
            hiddenClue: inputs.step3Hidden,
            networkData: inputs.step3Network,
            consoleSecret: inputs.step3Console,
            submitted: true,
          },
        });
      } else {
        setErrors((prev) => ({
          ...prev,
          step3:
            "Missing required DevTools discoveries. Check all three areas.",
        }));
      }
    } catch {
      setErrors((prev) => ({ ...prev, step3: "Error processing submission." }));
    }
    setLoading((prev) => ({ ...prev, step3: false }));
  };

  const handleStep4Submit = async () => {
    if (!userData) return;
    setLoading((prev) => ({ ...prev, step4: true }));
    setErrors((prev) => ({ ...prev, step4: "" }));

    try {
      const hasValidEndpoint = inputs.step4Endpoint.includes(userData.userHash);
      const hasValidAuth = inputs.step4Auth.includes("Bearer");
      const hasValidResponse = inputs.step4Api.length > 0;

      if (hasValidEndpoint && hasValidAuth && hasValidResponse) {
        saveProgress({
          ...progress,
          currentStep: 5,
          completedSteps: [...progress.completedSteps, 4],
          step4Data: {
            apiResponse: inputs.step4Api,
            authToken: inputs.step4Auth,
            endpointUrl: inputs.step4Endpoint,
            submitted: true,
          },
        });
      } else {
        setErrors((prev) => ({
          ...prev,
          step4:
            "Invalid API interaction. Check endpoint, auth header, and response.",
        }));
      }
    } catch {
      setErrors((prev) => ({ ...prev, step4: "Error processing submission." }));
    }
    setLoading((prev) => ({ ...prev, step4: false }));
  };

  const handleStep5Submit = async () => {
    setLoading((prev) => ({ ...prev, step5: true }));
    setErrors((prev) => ({ ...prev, step5: "" }));

    try {
      const hasName = inputs.step5Message.includes(
        user?.user_metadata?.full_name ||
          user?.email?.split("@")[0] ||
          "Student"
      );
      const hasEncrypted = inputs.step5Encrypted.length > 0;

      if (hasName && hasEncrypted) {
        saveProgress({
          ...progress,
          currentStep: 6,
          completedSteps: [...progress.completedSteps, 5],
          step5Data: {
            encryptedMessage: inputs.step5Encrypted,
            originalMessage: inputs.step5Message,
            submitted: true,
          },
        });
        setTimeout(
          () => router.push(`/challenges/${challengeId}?completed=true`),
          2000
        );
      } else {
        setErrors((prev) => ({
          ...prev,
          step5:
            "Include your name in the message and provide encrypted output.",
        }));
      }
    } catch {
      setErrors((prev) => ({ ...prev, step5: "Error processing submission." }));
    }
    setLoading((prev) => ({ ...prev, step5: false }));
  };

  const updateInput = (field: string, value: string) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Sign In Required
            </h1>
            <p className="text-gray-600 mb-6">
              You need to be signed in to access this challenge.
            </p>
            <Link href="/">
              <Button size="lg">Sign In to Continue</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Challenge Error
            </h1>
            <p className="text-gray-600 mb-6">
              Unable to generate your personalized challenge data.
            </p>
            <Link href={`/challenges/${challengeId}`}>
              <Button>Back to Challenge</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/challenges/${challengeId}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Challenge
            </Button>
          </Link>

          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Encryptions and Devtools Challenge
            </h1>
            <div className="flex justify-center items-center gap-4 mb-6">
              <Badge variant="outline" className="text-lg px-4 py-2">
                Progress: {progress.completedSteps.length}/5 Steps
              </Badge>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                50 Points
              </Badge>
            </div>
            <Progress
              value={(progress.completedSteps.length / 5) * 100}
              className="w-full max-w-md mx-auto h-3"
            />
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Step 1: JWT Security Analysis */}
          <Card
            className={`transition-all duration-300 ${
              progress.completedSteps.includes(1)
                ? "ring-2 ring-green-200 bg-green-50"
                : progress.currentStep === 1
                ? "ring-2 ring-blue-200"
                : "opacity-75"
            }`}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                {progress.completedSteps.includes(1) ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : progress.currentStep === 1 ? (
                  <Unlock className="h-6 w-6 text-blue-500" />
                ) : (
                  <Lock className="h-6 w-6 text-gray-400" />
                )}
                <CardTitle>Step 1: JWT Security Analysis</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {progress.currentStep >= 1 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">
                      🎓 Real-World Context
                    </h4>
                    <p className="text-sm text-gray-700">
                      JWT (JSON Web Tokens) are the industry standard for secure
                      authentication in modern web applications. Companies like
                      Auth0, Firebase, and AWS Cognito use JWTs for millions of
                      users daily.
                    </p>
                  </div>

                  <p className="text-gray-700">
                    Decode the JWT token below to reveal the hidden payload.
                    This simulates how a developer would validate authentication
                    tokens in a production environment. Paste the decoded JSON
                    content.
                  </p>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-semibold">Your JWT Token:</label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowJwtToken(!showJwtToken)}
                        >
                          {showJwtToken ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(userData.jwtToken)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <code className="text-sm break-all bg-white p-2 rounded border block">
                      {showJwtToken ? userData.jwtToken : "•".repeat(100)}
                    </code>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-semibold">JWT Secret Key:</label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(userData.jwtKey)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <code className="text-sm bg-white p-2 rounded border block">
                      {userData.jwtKey}
                    </code>
                  </div>

                  {!progress.completedSteps.includes(1) && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Paste your decoded JWT payload:
                        </label>
                        <Textarea
                          value={inputs.step1}
                          onChange={(e) => updateInput("step1", e.target.value)}
                          placeholder="Decode the JWT and paste the payload JSON here (e.g., the decoded content from jwt.io)..."
                          className="min-h-24"
                        />
                      </div>

                      {errors.step1 && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{errors.step1}</AlertDescription>
                        </Alert>
                      )}

                      <div className="flex gap-4">
                        <Button
                          onClick={handleStep1Submit}
                          disabled={loading.step1 || !inputs.step1.trim()}
                        >
                          {loading.step1 ? "Validating..." : "Submit Step 1"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            setShowHints((prev) => ({
                              ...prev,
                              step1: !prev.step1,
                            }))
                          }
                        >
                          {showHints.step1 ? "Hide Hint" : "Show Hint"}
                        </Button>
                      </div>

                      {showHints.step1 && (
                        <Alert>
                          <Key className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Hint:</strong> Use{" "}
                            <a
                              href="https://jwt.io"
                              target="_blank"
                              rel="noopener"
                              className="text-blue-600 underline"
                            >
                              jwt.io
                            </a>{" "}
                            to decode the token, or manually decode the middle
                            section (payload) using base64 decoding.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}

                  {progress.step1Data.submitted && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">
                        ✅ Step 1 Complete!
                      </h4>
                      <p className="text-green-700 text-sm">
                        <strong>Message:</strong>{" "}
                        {progress.step1Data.decodedMessage}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Repository Investigation */}
          <Card
            className={`transition-all duration-300 ${
              progress.completedSteps.includes(2)
                ? "ring-2 ring-green-200 bg-green-50"
                : progress.currentStep === 2
                ? "ring-2 ring-blue-200"
                : "opacity-75"
            }`}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                {progress.completedSteps.includes(2) ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : progress.currentStep === 2 ? (
                  <Github className="h-6 w-6 text-blue-500" />
                ) : (
                  <Lock className="h-6 w-6 text-gray-400" />
                )}
                <CardTitle>Step 2: Repository Investigation</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {progress.currentStep >= 2 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">
                      🎓 Real-World Context
                    </h4>
                    <p className="text-sm text-gray-700">
                      Developers regularly navigate GitHub repositories to find
                      configuration files, API documentation, and deployment
                      scripts. This skill is essential for onboarding to new
                      projects and debugging issues.
                    </p>
                  </div>

                  <p className="text-gray-700">
                    Use the clue from Step 1 to find the correct configuration
                    file in the KIU-lecture-aid repository. Look for a file
                    matching your user hash in the specified directory.
                  </p>

                  <Alert>
                    <Github className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Repository:</strong> KIU-lecture-aid |{" "}
                      <strong>Directory:</strong> /assets/challenge-data/ |
                      <strong>File:</strong> config-{userData.userHash}.json
                    </AlertDescription>
                  </Alert>

                  {!progress.completedSteps.includes(2) && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Paste the contents of the config file you found:
                        </label>
                        <Textarea
                          value={inputs.step2}
                          onChange={(e) => updateInput("step2", e.target.value)}
                          placeholder="Paste the JSON config file contents here..."
                          className="min-h-32 font-mono text-sm"
                        />
                      </div>

                      {errors.step2 && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{errors.step2}</AlertDescription>
                        </Alert>
                      )}

                      <div className="flex gap-4">
                        <Button
                          onClick={handleStep2Submit}
                          disabled={loading.step2 || !inputs.step2.trim()}
                        >
                          {loading.step2 ? "Validating..." : "Submit Step 2"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            setShowHints((prev) => ({
                              ...prev,
                              step2: !prev.step2,
                            }))
                          }
                        >
                          {showHints.step2 ? "Hide Hint" : "Show Hint"}
                        </Button>
                      </div>

                      {showHints.step2 && (
                        <Alert>
                          <Github className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Hint:</strong> Navigate to the GitHub
                            repository and look in the assets/challenge-data/
                            directory. Your file should contain your user hash:{" "}
                            {userData.userHash}
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}

                  {progress.step2Data.submitted && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">
                        ✅ Step 2 Complete!
                      </h4>
                      <p className="text-green-700 text-sm">
                        Config file successfully located and validated!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Browser DevTools Mastery */}
          <Card
            className={`transition-all duration-300 ${
              progress.completedSteps.includes(3)
                ? "ring-2 ring-green-200 bg-green-50"
                : progress.currentStep === 3
                ? "ring-2 ring-blue-200"
                : "opacity-75"
            }`}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                {progress.completedSteps.includes(3) ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : progress.currentStep === 3 ? (
                  <Search className="h-6 w-6 text-blue-500" />
                ) : (
                  <Lock className="h-6 w-6 text-gray-400" />
                )}
                <CardTitle>Step 3: Browser DevTools Mastery</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {progress.currentStep >= 3 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">
                      🎓 Real-World Context
                    </h4>
                    <p className="text-sm text-gray-700">
                      DevTools are essential for debugging frontend
                      applications, analyzing network performance, and finding
                      security issues. Every professional developer uses these
                      tools daily.
                    </p>
                  </div>

                  <p className="text-gray-700">
                    Use your browser&apos;s Developer Tools to find three hidden
                    pieces of information on this page. Look in the Elements,
                    Network, and Console tabs.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-semibold mb-2">🔍 Hidden Element</h5>
                      <p className="text-sm text-gray-600 mb-2">
                        Find the hidden HTML comment containing your user hash
                      </p>
                      <Input
                        value={inputs.step3Hidden}
                        onChange={(e) =>
                          updateInput("step3Hidden", e.target.value)
                        }
                        placeholder="Hidden clue..."
                        disabled={progress.completedSteps.includes(3)}
                      />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-semibold mb-2">🌐 Network Request</h5>
                      <p className="text-sm text-gray-600 mb-2">
                        Check the Network tab for XHR requests
                      </p>
                      <Input
                        value={inputs.step3Network}
                        onChange={(e) =>
                          updateInput("step3Network", e.target.value)
                        }
                        placeholder="Network endpoint..."
                        disabled={progress.completedSteps.includes(3)}
                      />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-semibold mb-2">💻 Console Message</h5>
                      <p className="text-sm text-gray-600 mb-2">
                        Look for a console log with your DevTools clue
                      </p>
                      <Input
                        value={inputs.step3Console}
                        onChange={(e) =>
                          updateInput("step3Console", e.target.value)
                        }
                        placeholder="Console secret..."
                        disabled={progress.completedSteps.includes(3)}
                      />
                    </div>
                  </div>

                  {!progress.completedSteps.includes(3) && (
                    <>
                      {errors.step3 && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{errors.step3}</AlertDescription>
                        </Alert>
                      )}

                      <div className="flex gap-4">
                        <Button
                          onClick={handleStep3Submit}
                          disabled={
                            loading.step3 ||
                            !inputs.step3Hidden ||
                            !inputs.step3Network ||
                            !inputs.step3Console
                          }
                        >
                          {loading.step3 ? "Validating..." : "Submit Step 3"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            setShowHints((prev) => ({
                              ...prev,
                              step3: !prev.step3,
                            }))
                          }
                        >
                          {showHints.step3 ? "Hide Hint" : "Show Hint"}
                        </Button>
                      </div>

                      {showHints.step3 && (
                        <Alert>
                          <Search className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Hint:</strong> Press F12 to open DevTools.
                            Check Elements tab for HTML comments, Network tab
                            for /api/challenge/step3 requests, and Console for
                            logged messages.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}

                  {progress.step3Data.submitted && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">
                        ✅ Step 3 Complete!
                      </h4>
                      <p className="text-green-700 text-sm">
                        All DevTools investigations successful!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 4: API Interaction & Authentication */}
          <Card
            className={`transition-all duration-300 ${
              progress.completedSteps.includes(4)
                ? "ring-2 ring-green-200 bg-green-50"
                : progress.currentStep === 4
                ? "ring-2 ring-blue-200"
                : "opacity-75"
            }`}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                {progress.completedSteps.includes(4) ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : progress.currentStep === 4 ? (
                  <Server className="h-6 w-6 text-blue-500" />
                ) : (
                  <Lock className="h-6 w-6 text-gray-400" />
                )}
                <CardTitle>Step 4: API Interaction & Authentication</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {progress.currentStep >= 4 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">
                      🎓 Real-World Context
                    </h4>
                    <p className="text-sm text-gray-700">
                      Modern applications communicate with APIs using proper
                      authentication headers. This pattern is used by REST APIs,
                      GraphQL endpoints, and microservices architectures.
                    </p>
                  </div>

                  <p className="text-gray-700">
                    Simulate making an authenticated API request. Use the
                    endpoint and auth token specific to your user, then provide
                    a mock response that would be returned.
                  </p>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">
                      API Endpoint Template:
                    </h5>
                    <code className="text-sm bg-white p-2 rounded border block">
                      {userData.apiEndpoint}
                    </code>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">
                      Authentication Header:
                    </h5>
                    <code className="text-sm bg-white p-2 rounded border block">
                      Authorization: {userData.authToken}
                    </code>
                  </div>

                  {!progress.completedSteps.includes(4) && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            API Endpoint:
                          </label>
                          <Input
                            value={inputs.step4Endpoint}
                            onChange={(e) =>
                              updateInput("step4Endpoint", e.target.value)
                            }
                            placeholder={userData.apiEndpoint}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Auth Header:
                          </label>
                          <Input
                            value={inputs.step4Auth}
                            onChange={(e) =>
                              updateInput("step4Auth", e.target.value)
                            }
                            placeholder="Bearer token..."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Simulated API Response (JSON):
                        </label>
                        <Textarea
                          value={inputs.step4Api}
                          onChange={(e) =>
                            updateInput("step4Api", e.target.value)
                          }
                          placeholder='{"status": "success", "data": {...}, "message": "..."}'
                          className="min-h-24 font-mono text-sm"
                        />
                      </div>

                      {errors.step4 && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{errors.step4}</AlertDescription>
                        </Alert>
                      )}

                      <div className="flex gap-4">
                        <Button
                          onClick={handleStep4Submit}
                          disabled={
                            loading.step4 ||
                            !inputs.step4Endpoint ||
                            !inputs.step4Auth ||
                            !inputs.step4Api
                          }
                        >
                          {loading.step4 ? "Validating..." : "Submit Step 4"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            setShowHints((prev) => ({
                              ...prev,
                              step4: !prev.step4,
                            }))
                          }
                        >
                          {showHints.step4 ? "Hide Hint" : "Show Hint"}
                        </Button>
                      </div>

                      {showHints.step4 && (
                        <Alert>
                          <Server className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Hint:</strong> Include your user hash in the
                            endpoint, use &quot;Bearer&quot; in the auth header,
                            and create a realistic JSON response with status,
                            data, and message fields.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}

                  {progress.step4Data.submitted && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">
                        ✅ Step 4 Complete!
                      </h4>
                      <p className="text-green-700 text-sm">
                        API interaction successfully validated!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 5: Advanced Encryption Implementation */}
          <Card
            className={`transition-all duration-300 ${
              progress.completedSteps.includes(5)
                ? "ring-2 ring-green-200 bg-green-50"
                : progress.currentStep === 5
                ? "ring-2 ring-blue-200"
                : "opacity-75"
            }`}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                {progress.completedSteps.includes(5) ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : progress.currentStep === 5 ? (
                  <ShieldCheck className="h-6 w-6 text-blue-500" />
                ) : (
                  <Lock className="h-6 w-6 text-gray-400" />
                )}
                <CardTitle>
                  Step 5: Advanced Encryption Implementation
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {progress.currentStep >= 5 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">
                      🎓 Real-World Context
                    </h4>
                    <p className="text-sm text-gray-700">
                      RSA encryption is used everywhere: HTTPS connections,
                      secure messaging, payment processing, and cloud services.
                      Understanding encryption is crucial for building secure
                      applications.
                    </p>
                  </div>

                  <p className="text-gray-700">
                    Create your final message and encrypt it using RSA
                    encryption. This demonstrates end-to-end encryption
                    techniques used in production security systems.
                  </p>

                  {!progress.completedSteps.includes(5) && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Your Message (include your name):
                        </label>
                        <Input
                          value={inputs.step5Message}
                          onChange={(e) =>
                            updateInput("step5Message", e.target.value)
                          }
                          placeholder={`Mission Accomplished - ${
                            user?.user_metadata?.full_name ||
                            user?.email?.split("@")[0] ||
                            "Your Name"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Encrypted Message (Base64 or Hex):
                        </label>
                        <Textarea
                          value={inputs.step5Encrypted}
                          onChange={(e) =>
                            updateInput("step5Encrypted", e.target.value)
                          }
                          placeholder="Paste your encrypted message here..."
                          className="min-h-24 font-mono text-sm"
                        />
                      </div>

                      {errors.step5 && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{errors.step5}</AlertDescription>
                        </Alert>
                      )}

                      <div className="flex gap-4">
                        <Button
                          onClick={handleStep5Submit}
                          disabled={
                            loading.step5 ||
                            !inputs.step5Message ||
                            !inputs.step5Encrypted
                          }
                          className="bg-green-500 hover:bg-green-600"
                        >
                          {loading.step5
                            ? "Submitting..."
                            : "Complete Challenge"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            setShowHints((prev) => ({
                              ...prev,
                              step5: !prev.step5,
                            }))
                          }
                        >
                          {showHints.step5 ? "Hide Hint" : "Show Hint"}
                        </Button>
                      </div>

                      {showHints.step5 && (
                        <Alert>
                          <ShieldCheck className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Hint:</strong> Use online RSA encryption
                            tools or write code with the public key from Step 2.
                            Ensure your message includes your name and the
                            encryption is in Base64 or Hex format.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}

                  {progress.step5Data.submitted && (
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                      <h4 className="font-bold text-green-800 text-xl mb-2">
                        🎉 Challenge Complete!
                      </h4>
                      <p className="text-green-700">
                        Congratulations! You&apos;ve mastered JWT analysis,
                        repository investigation, DevTools usage, API
                        interaction, and encryption techniques!
                      </p>
                      <Badge className="mt-2 bg-yellow-500 text-white">
                        +50 Points Earned!
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Hidden elements for DevTools discovery */}
        <div style={{ display: "none" }}>
          {/* Hidden HTML comment with user hash */}
          {userData && (
            <>
              {/* HTML comment: Hidden-Clue-{userHash} */}
              <div data-clue={`Hidden-Clue-${userData.userHash}`}></div>
              <script
                dangerouslySetInnerHTML={{
                  __html: `console.log('${userData.devToolsClue}');`,
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

{
  /* HTML Comments for DevTools */
}
{
  /* Hidden-Clue-USER_HASH: This is the hidden element students need to find */
}
