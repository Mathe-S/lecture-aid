"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Import our new components and hooks
import { ChallengeHeader } from "@/components/challenges/ChallengeHeader";
import { Step1, Step2, Step3, Step4 } from "@/components/challenges/steps";
import { useUserData } from "@/components/challenges/hooks/useUserData";
import { useChallengeProgress } from "@/components/challenges/hooks/useChallengeProgress";
import { createStepHandlers } from "@/components/challenges/handlers/stepHandlers";
import {
  ChallengeInputs,
  StepState,
  StepErrors,
} from "@/components/challenges/types";

export default function ChallengeInterface() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const challengeId = params.challengeId as string;

  // Use our custom hooks
  const userData = useUserData(user);
  const { progress, saveProgress } = useChallengeProgress(
    user,
    userData,
    challengeId
  );

  // Form states
  const [inputs, setInputs] = useState<ChallengeInputs>({
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
  const [showHints, setShowHints] = useState<StepState>({
    step1: false,
    step2: false,
    step3: false,
    step4: false,
    step5: false,
  });
  const [loading, setLoading] = useState<StepState>({
    step1: false,
    step2: false,
    step3: false,
    step4: false,
    step5: false,
  });
  const [errors, setErrors] = useState<StepErrors>({
    step1: "",
    step2: "",
    step3: "",
    step4: "",
    step5: "",
  });

  // Create step handlers
  const stepHandlers = createStepHandlers(
    user,
    userData,
    progress,
    inputs,
    saveProgress,
    setLoading,
    setErrors
  );

  // Utility functions
  const updateInput = (field: keyof ChallengeInputs, value: string) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const toggleHint = (step: keyof StepState) => {
    setShowHints((prev) => ({ ...prev, [step]: !prev[step] }));
  };

  // Redirect if not authenticated (but wait for auth to load)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading challenge...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user || !userData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access the security challenge.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ChallengeHeader progress={progress} />

      <div className="space-y-6">
        <Step1
          userData={userData}
          progress={progress}
          input={inputs.step1}
          onInputChange={(value) => updateInput("step1", value)}
          onSubmit={stepHandlers.handleStep1Submit}
          loading={loading.step1}
          error={errors.step1}
          showJwtToken={showJwtToken}
          onToggleJwtToken={() => setShowJwtToken(!showJwtToken)}
          showHint={showHints.step1}
          onToggleHint={() => toggleHint("step1")}
        />

        <Step2
          userData={userData}
          progress={progress}
          input={inputs.step2}
          onInputChange={(value) => updateInput("step2", value)}
          onSubmit={stepHandlers.handleStep2Submit}
          loading={loading.step2}
          error={errors.step2}
          showHint={showHints.step2}
          onToggleHint={() => toggleHint("step2")}
        />

        <Step3
          userData={userData}
          progress={progress}
          hiddenInput={inputs.step3Hidden}
          networkInput={inputs.step3Network}
          consoleInput={inputs.step3Console}
          onHiddenInputChange={(value) => updateInput("step3Hidden", value)}
          onNetworkInputChange={(value) => updateInput("step3Network", value)}
          onConsoleInputChange={(value) => updateInput("step3Console", value)}
          onSubmit={stepHandlers.handleStep3Submit}
          loading={loading.step3}
          error={errors.step3}
          showHint={showHints.step3}
          onToggleHint={() => toggleHint("step3")}
        />

        <Step4
          userData={userData}
          progress={progress}
          apiInput={inputs.step4Api}
          authInput={inputs.step4Auth}
          endpointInput={inputs.step4Endpoint}
          onApiInputChange={(value) => updateInput("step4Api", value)}
          onAuthInputChange={(value) => updateInput("step4Auth", value)}
          onEndpointInputChange={(value) => updateInput("step4Endpoint", value)}
          onSubmit={stepHandlers.handleStep4Submit}
          loading={loading.step4}
          error={errors.step4}
          showHint={showHints.step4}
          onToggleHint={() => toggleHint("step4")}
        />

        {/* TODO: Add Step5 component */}
        {progress.currentStep >= 5 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Step 5 is being refactored. Please check back soon!
            </AlertDescription>
          </Alert>
        )}
      </div>

      {progress.completedSteps.length === 5 && (
        <div className="mt-8 text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              🎉 Congratulations!
            </h2>
            <p className="text-green-700">
              You&apos;ve successfully completed all security challenges!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
