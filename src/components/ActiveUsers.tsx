"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Users } from "lucide-react";

const PRESENCE_CHANNEL = "online-users";

// Define the possible status types for the subscribe callback
type ChannelStatus = "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR";

// Structure for the data tracked in presence
interface PresenceInfo {
  online_at: string;
  user_info: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export function ActiveUsers() {
  const [count, setCount] = useState<number>(0);
  const { user, isLoading: isAuthLoading } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    // Only run if authentication is resolved and user is logged in
    if (isAuthLoading || !user) {
      setCount(0); // Reset count if user logs out or while loading
      return;
    }

    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: {
        presence: {
          key: user.id, // Unique key for this user's presence
        },
      },
    });

    const handleSync = () => {
      // Specify the type for presenceState
      const presenceState = channel.presenceState<PresenceInfo>();
      const userIds = Object.keys(presenceState);
      setCount(userIds.length);
    };

    channel
      .on("presence", { event: "sync" }, handleSync)
      .on("presence", { event: "join" }, handleSync) // Update count on join
      .on("presence", { event: "leave" }, handleSync) // Update count on leave
      .subscribe(async (status: ChannelStatus) => {
        if (status === "SUBSCRIBED") {
          // User successfully joined the channel, track their presence with user info
          const name = user.user_metadata?.full_name || user.email || user.id;
          const avatar_url = user.user_metadata?.avatar_url;
          await channel.track({
            online_at: new Date().toISOString(),
            user_info: {
              id: user.id,
              name: name,
              avatar_url: avatar_url,
            },
          });
          // Initial sync after subscribing might be needed if sync event doesn't fire immediately
          handleSync();
        }
      });

    // Cleanup function
    return () => {
      channel.unsubscribe();
    };
    // Depend on user.id to re-subscribe if the user changes (though typically handled by AuthProvider unmounting/remounting)
    // Depend on isAuthLoading to trigger effect when auth state resolves
  }, [user, isAuthLoading]);

  // Don't render if auth is loading or user is not logged in
  if (isAuthLoading || !user) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 text-sm text-slate-600">
      <Users className="h-4 w-4" />
      <span>{count}</span>
      <span className="hidden sm:inline">Online</span>
    </div>
  );
}
