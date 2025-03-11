// Create this file to centralize environment variable access

export const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    // Browser should use the current URL as base
    return window.location.origin;
  }

  // Default to localhost for development
  return "http://localhost:3000";
};

export const getRedirectUrl = (path: string = "/auth/callback") => {
  return `${getBaseUrl()}${path}`;
};
