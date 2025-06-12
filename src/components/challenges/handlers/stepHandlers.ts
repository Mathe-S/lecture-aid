import { User } from "@supabase/supabase-js";
import {
  ChallengeProgress,
  ChallengeInputs,
  UserData,
  StepErrors,
} from "../types";

export const createStepHandlers = (
  user: User | null,
  userData: UserData | null,
  progress: ChallengeProgress,
  inputs: ChallengeInputs,
  saveProgress: (progress: ChallengeProgress) => void,
  setLoading: (fn: (prev: any) => any) => void,
  setErrors: (fn: (prev: StepErrors) => StepErrors) => void
) => {
  const handleStep1Submit = async () => {
    if (!userData) return;
    setLoading((prev: any) => ({ ...prev, step1: true }));
    setErrors((prev: StepErrors) => ({ ...prev, step1: "" }));

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
        setErrors((prev: StepErrors) => ({
          ...prev,
          step1:
            "Invalid JWT decode. Please decode the JWT token and paste the payload content.",
        }));
      }
    } catch {
      setErrors((prev: StepErrors) => ({
        ...prev,
        step1: "Error processing submission.",
      }));
    }
    setLoading((prev: any) => ({ ...prev, step1: false }));
  };

  const handleStep2Submit = async () => {
    if (!userData || !user) return;
    setLoading((prev: any) => ({ ...prev, step2: true }));
    setErrors((prev: StepErrors) => ({ ...prev, step2: "" }));

    try {
      // Check if input looks like a JWT (3 parts separated by dots)
      const jwtParts = inputs.step2.trim().split(".");
      if (jwtParts.length !== 3) {
        setErrors((prev: StepErrors) => ({
          ...prev,
          step2:
            "Invalid JWT format. JWT should have 3 parts separated by dots.",
        }));
        setLoading((prev: any) => ({ ...prev, step2: false }));
        return;
      }

      // Decode the JWT header and payload
      try {
        const header = JSON.parse(atob(jwtParts[0]));
        const payload = JSON.parse(atob(jwtParts[1]));

        // Check if payload contains expected config data
        if (
          !payload.challenge ||
          payload.challenge !== "step2-complete" ||
          !payload.completion_status ||
          payload.completion_status !== "step2-complete"
        ) {
          setErrors((prev: StepErrors) => ({
            ...prev,
            step2:
              "JWT payload doesn't contain the expected config file content.",
          }));
          setLoading((prev: any) => ({ ...prev, step2: false }));
          return;
        }

        // Verify JWT signature was created with user's ID as secret
        if (header.alg === "HS256" && header.typ === "JWT") {
          try {
            // Verify JWT signature using proper HMAC-SHA256
            const encoder = new TextEncoder();
            const algorithm = { name: "HMAC", hash: "SHA-256" };

            // Import the user's ID as the signing key
            const keyData = encoder.encode(user.id);
            const key = await crypto.subtle.importKey(
              "raw",
              keyData,
              algorithm,
              false,
              ["verify"]
            );

            // Create the data that should have been signed (header.payload)
            const dataToVerify = encoder.encode(
              `${jwtParts[0]}.${jwtParts[1]}`
            );

            // Convert base64url signature to ArrayBuffer
            const signature = Uint8Array.from(
              atob(
                jwtParts[2].replace(/-/g, "+").replace(/_/g, "/") +
                  "==".slice(0, (4 - (jwtParts[2].length % 4)) % 4)
              ),
              (c) => c.charCodeAt(0)
            );

            // Verify the signature
            const isValid = await crypto.subtle.verify(
              algorithm,
              key,
              signature,
              dataToVerify
            );

            if (isValid) {
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
              setErrors((prev: StepErrors) => ({
                ...prev,
                step2:
                  "JWT signature verification failed. The JWT was not signed with your User ID as the secret. Please use jwt.io with your exact User ID.",
              }));
            }
          } catch {
            setErrors((prev: StepErrors) => ({
              ...prev,
              step2:
                "Error verifying JWT signature. Please ensure you created a valid JWT using jwt.io with your User ID as the secret.",
            }));
          }
        } else {
          setErrors((prev: StepErrors) => ({
            ...prev,
            step2:
              "JWT header is incorrect. Make sure you're using HS256 algorithm.",
          }));
        }
      } catch {
        setErrors((prev: StepErrors) => ({
          ...prev,
          step2: "Invalid JWT format. Please check your JWT token.",
        }));
      }
    } catch {
      setErrors((prev: StepErrors) => ({
        ...prev,
        step2: "Error processing submission.",
      }));
    }
    setLoading((prev: any) => ({ ...prev, step2: false }));
  };

  const handleStep3Submit = async () => {
    if (!userData) return;
    setLoading((prev: any) => ({ ...prev, step3: true }));
    setErrors((prev: StepErrors) => ({ ...prev, step3: "" }));

    const expectedHidden = `hidden-element-${userData.userHash}`;
    const expectedNetwork = userData.userHash;
    const expectedConsole = `challenge_${userData.userHash}_complete`;

    // Check each input individually
    const hiddenCorrect = inputs.step3Hidden.includes(expectedHidden);
    const networkCorrect = inputs.step3Network.includes(expectedNetwork);
    const consoleCorrect = inputs.step3Console.includes(expectedConsole);

    if (hiddenCorrect && networkCorrect && consoleCorrect) {
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
      // Provide specific feedback for each area
      const errorMessages: string[] = [];

      if (!hiddenCorrect) {
        errorMessages.push(
          "❌ Hidden Element: Incorrect or missing. Look for an element with ID containing your user hash."
        );
      } else {
        errorMessages.push("✅ Hidden Element: Correct!");
      }

      if (!networkCorrect) {
        errorMessages.push(
          "❌ Network Data: Incorrect or missing. Check the Network tab for requests with your DevTools clue."
        );
      } else {
        errorMessages.push("✅ Network Data: Correct!");
      }

      if (!consoleCorrect) {
        errorMessages.push(
          "❌ Console Secret: Incorrect or missing. Look for console messages containing your user hash."
        );
      } else {
        errorMessages.push("✅ Console Secret: Correct!");
      }

      setErrors((prev: StepErrors) => ({
        ...prev,
        step3: errorMessages.join("\n"),
      }));
    }
    setLoading((prev: any) => ({ ...prev, step3: false }));
  };

  const handleStep4Submit = async () => {
    if (!userData) return;
    setLoading((prev: any) => ({ ...prev, step4: true }));
    setErrors((prev: StepErrors) => ({ ...prev, step4: "" }));

    const expectedAuth = userData.authToken;
    const expectedEndpoint = userData.apiEndpoint;

    // Check each input individually
    const apiCorrect =
      inputs.step4Api.includes(userData.userHash) &&
      inputs.step4Api.includes("API challenge complete");
    const authCorrect = inputs.step4Auth.includes(expectedAuth);
    const endpointCorrect = inputs.step4Endpoint.includes(expectedEndpoint);

    if (apiCorrect && authCorrect && endpointCorrect) {
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
      // Provide specific feedback for each area
      const errorMessages: string[] = [];

      if (!apiCorrect) {
        errorMessages.push(
          "❌ API Response: Incorrect or missing. Make sure you received a response containing your user hash and 'API challenge complete'."
        );
      } else {
        errorMessages.push("✅ API Response: Correct!");
      }

      if (!authCorrect) {
        errorMessages.push(
          "❌ Auth Token: Incorrect or missing. Use the exact authorization token provided."
        );
      } else {
        errorMessages.push("✅ Auth Token: Correct!");
      }

      if (!endpointCorrect) {
        errorMessages.push(
          "❌ Endpoint URL: Incorrect or missing. Use the exact API endpoint provided."
        );
      } else {
        errorMessages.push("✅ Endpoint URL: Correct!");
      }

      setErrors((prev: StepErrors) => ({
        ...prev,
        step4: errorMessages.join("\n"),
      }));
    }
    setLoading((prev: any) => ({ ...prev, step4: false }));
  };

  const handleStep5Submit = async () => {
    if (!userData) return;
    setLoading((prev: any) => ({ ...prev, step5: true }));
    setErrors((prev: StepErrors) => ({ ...prev, step5: "" }));

    const expectedMessage = `MASTER_KEY_${userData.userHash}_VERIFIED`;
    const expectedXorKey = userData.userHash.slice(0, 8);
    const expectedSnippet = `SECURITY_SNIPPET_${userData.userHash}`;

    // Generate expected SHA-256 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(expectedMessage);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedHash = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Check each input individually
    const cipherCorrect = inputs.step5Cipher.includes(expectedMessage);
    const keyCorrect = inputs.step5Key.includes(expectedXorKey);
    const hashCorrect = inputs.step5Hash.includes(expectedHash);
    const snippetCorrect = inputs.step5Snippet.includes(expectedSnippet);

    if (cipherCorrect && keyCorrect && hashCorrect && snippetCorrect) {
      saveProgress({
        ...progress,
        currentStep: 6,
        completedSteps: [...progress.completedSteps, 5],
        step5Data: {
          decryptedMessage: inputs.step5Cipher,
          xorKey: inputs.step5Key,
          messageHash: inputs.step5Hash,
          verificationSnippet: inputs.step5Snippet,
          submitted: true,
        },
      });
    } else {
      // Provide specific feedback for each area
      const errorMessages: string[] = [];

      if (!cipherCorrect) {
        errorMessages.push(
          "❌ Decrypted Message: Incorrect. Should be MASTER_KEY_[your_hash]_VERIFIED"
        );
      } else {
        errorMessages.push("✅ Decrypted Message: Correct!");
      }

      if (!keyCorrect) {
        errorMessages.push(
          "❌ XOR Key: Incorrect. Check localStorage for the key with your hash."
        );
      } else {
        errorMessages.push("✅ XOR Key: Correct!");
      }

      if (!hashCorrect) {
        errorMessages.push(
          "❌ SHA-256 Hash: Incorrect. Hash the decrypted message using crypto.subtle."
        );
      } else {
        errorMessages.push("✅ SHA-256 Hash: Correct!");
      }

      if (!snippetCorrect) {
        errorMessages.push(
          "❌ Verification Snippet: Incorrect. Execute the verification function in console."
        );
      } else {
        errorMessages.push("✅ Verification Snippet: Correct!");
      }

      setErrors((prev: StepErrors) => ({
        ...prev,
        step5: errorMessages.join("\n"),
      }));
    }
    setLoading((prev: any) => ({ ...prev, step5: false }));
  };

  return {
    handleStep1Submit,
    handleStep2Submit,
    handleStep3Submit,
    handleStep4Submit,
    handleStep5Submit,
  };
};
