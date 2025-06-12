import { useMemo } from "react";
import { User } from "@supabase/supabase-js";
import { UserData } from "../types";

export function useUserData(user: User | null): UserData | null {
  return useMemo(() => {
    if (!user) return null;

    const userId = user.id;
    const userHash = btoa(userId).slice(0, 8);

    const payload = {
      user_id: userId,
      message: `Step 1 complete! For step 2, find the file 'challenge-config.json' in the KIU-lecture-aid repository under /assets/challenge-data/. This contains your DevTools clue.`,
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

    return {
      jwtToken,
      jwtKey,
      userHash,
      userId,
      devToolsClue,
      apiEndpoint,
      authToken,
    };
  }, [user]);
}
