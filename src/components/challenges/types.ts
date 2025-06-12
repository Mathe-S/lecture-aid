export interface ChallengeProgress {
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
    decryptedMessage: string;
    xorKey: string;
    messageHash: string;
    verificationSnippet: string;
    submitted: boolean;
  };
}

export interface UserData {
  jwtToken: string;
  jwtKey: string;
  userHash: string;
  userId: string;
  devToolsClue: string;
  apiEndpoint: string;
  authToken: string;
}

export interface ChallengeInputs {
  step1: string;
  step2: string;
  step3Hidden: string;
  step3Network: string;
  step3Console: string;
  step4Api: string;
  step4Auth: string;
  step4Endpoint: string;
  step5Cipher: string;
  step5Key: string;
  step5Hash: string;
  step5Snippet: string;
}

export interface StepState {
  step1: boolean;
  step2: boolean;
  step3: boolean;
  step4: boolean;
  step5: boolean;
}

export interface StepErrors {
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  step5: string;
}
