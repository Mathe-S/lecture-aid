"use client";

import { useEffect } from "react";
import NProgress from "nprogress";
import { usePathname } from "next/navigation";

// Import styles (add to your main CSS file or create a new one)
// import "nprogress/nprogress.css";

// Custom styles to match your theme
const progressStyles = `
  #nprogress {
    pointer-events: none;
  }
  
  #nprogress .bar {
    background: hsl(var(--primary));
    position: fixed;
    z-index: 1031;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
  }
`;

export function GlobalLoadingIndicator() {
  const pathname = usePathname();

  useEffect(() => {
    // Configure NProgress
    NProgress.configure({
      showSpinner: false,
      minimum: 0.1,
      speed: 300,
      trickleSpeed: 150,
      easing: "ease",
    });
  }, []);

  // Show progress bar on route changes
  useEffect(() => {
    NProgress.done();
    return () => {
      NProgress.start();
    };
  }, [pathname]);

  return (
    <style jsx global>
      {progressStyles}
    </style>
  );
}
