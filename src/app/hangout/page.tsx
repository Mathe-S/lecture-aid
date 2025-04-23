"use client";

import React, { useState } from "react";
import { JaaSMeeting } from "@jitsi/react-sdk";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

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
  const { user } = useAuth();
  const [apiReady, setApiReady] = useState(false);

  const router = useRouter();
  const handleApiReady = (externalApi: any) => {
    console.log("JaaS External API is ready:", externalApi);
    externalApi.on("readyToClose", onCallClose);
    setApiReady(true);
  };

  const onCallClose = () => {
    router.push("/dashboard");
  };

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] w-full">
      {!apiReady && <Spinner />}
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
        }}
        userInfo={{
          displayName: user?.user_metadata?.full_name || user?.email || "",
          email: user?.email || "",
        }}
        spinner={Spinner}
      />
    </div>
  );
}

export default JitsiMeetEmbed;
