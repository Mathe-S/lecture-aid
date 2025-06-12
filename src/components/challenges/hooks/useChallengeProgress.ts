import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { ChallengeProgress, UserData } from "../types";

const initialProgress: ChallengeProgress = {
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
};

export function useChallengeProgress(
  user: User | null,
  userData: UserData | null,
  challengeId: string
) {
  const [progress, setProgress] = useState<ChallengeProgress>(initialProgress);

  // Load progress from localStorage
  useEffect(() => {
    if (user && userData) {
      const saved = localStorage.getItem(`challenge_${challengeId}_${user.id}`);
      if (saved) {
        try {
          setProgress(JSON.parse(saved));
        } catch (error) {
          console.error("Error loading progress:", error);
        }
      }
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

  return { progress, saveProgress };
}
