import { useEffect } from "react";
import { UserData } from "../types";

export function useDevToolsEffects(
  userData: UserData | null,
  isActive: boolean
) {
  useEffect(() => {
    if (!userData || !isActive || typeof window === "undefined") return;

    // Create hidden element for students to find
    const hiddenElement = document.createElement("div");
    hiddenElement.id = `hidden-element-${userData.userHash}`;
    hiddenElement.style.display = "none";
    hiddenElement.setAttribute(
      "data-secret",
      `hidden-element-${userData.userHash}`
    );
    hiddenElement.textContent = `DevTools Secret: hidden-element-${userData.userHash}`;
    document.body.appendChild(hiddenElement);

    // Create network request for students to discover
    const timer = setTimeout(() => {
      fetch("/api/challenge/step3", {
        method: "POST",
        headers: {
          "X-DevTools-Clue": userData.devToolsClue,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userHash: userData.userHash }),
      }).catch(() => {
        // Ignore errors, this is just for DevTools discovery
      });

      // Log console message for students to find
      console.log(`Secret: challenge_${userData.userHash}_complete`);
    }, 1000);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      const element = document.getElementById(
        `hidden-element-${userData.userHash}`
      );
      if (element) {
        element.remove();
      }
    };
  }, [userData, isActive]);
}
