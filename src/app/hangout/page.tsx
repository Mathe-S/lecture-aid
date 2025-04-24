"use client";

import React, { useState, useEffect } from "react";
import { JaaSMeeting } from "@jitsi/react-sdk";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useHangoutStore } from "@/store/hangoutStore";

// Custom Spinner Component
function Spinner() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p>Loading Hangout Room...</p>
    </div>
  );
}

function JitsiMeetEmbed() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const trackPresence = useHangoutStore((state) => state.trackPresence);
  const untrackPresence = useHangoutStore((state) => state.untrackPresence);
  const [jitsiApiReady, setJitsiApiReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (jitsiApiReady && !isAuthLoading && user) {
      trackPresence();
    }

    return () => {
      if (jitsiApiReady) {
        untrackPresence();
      }
    };
  }, [jitsiApiReady, user, isAuthLoading, trackPresence, untrackPresence]);

  const handleApiReady = (externalApi: any) => {
    externalApi.on("readyToClose", onCallClose);
    setJitsiApiReady(true);
  };

  const onCallClose = () => {
    setJitsiApiReady(false);
    router.push("/dashboard");
  };

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] w-full relative">
      <Spinner />
      {!isAuthLoading && user && (
        <JaaSMeeting
          appId={process.env.NEXT_PUBLIC_JAAS_APP_ID!}
          roomName={"hangout"}
          configOverwrite={{
            disableThirdPartyRequests: true,
            disableLocalVideoFlip: true,
            backgroundAlpha: 0.5,
            prejoinPageEnabled: false,
            startWithAudioMuted: true,
            startWithVideoMuted: true,
          }}
          interfaceConfigOverwrite={{
            VIDEO_LAYOUT_FIT: "nocrop",
            MOBILE_APP_PROMO: false,
            TILE_VIEW_MAX_COLUMNS: 4,
            TOOLBAR_ALWAYS_VISIBLE: true,
            SHOW_JITSI_WATERMARK: false,
          }}
          onApiReady={handleApiReady}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = "100%";
            iframeRef.style.width = "100%";
            iframeRef.style.position = "absolute"; // Ensure iframe covers spinner
            iframeRef.style.inset = "0";
          }}
          userInfo={{
            displayName:
              user?.user_metadata?.full_name || user?.email || "Student",
            email: user?.email || "",
          }}
          spinner={() => null}
        />
      )}
    </div>
  );
}

export default JitsiMeetEmbed;
