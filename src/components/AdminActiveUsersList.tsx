"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const PRESENCE_CHANNEL = "online-users";
type ChannelStatus = "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR";

interface UserInfo {
  id: string;
  name: string;
  avatar_url?: string;
}

interface PresenceInfo {
  online_at: string;
  user_info: UserInfo;
}

export function AdminActiveUsersList() {
  const [activeUsers, setActiveUsers] = useState<UserInfo[]>([]);
  const { user, isLoading: isAuthLoading } = useAuth(); // We still need user for tracking self
  const supabase = createClient();

  useEffect(() => {
    if (isAuthLoading || !user) {
      setActiveUsers([]);
      return;
    }

    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    const handleSync = () => {
      const presenceState = channel.presenceState<PresenceInfo>();
      // Map the presence state to an array of UserInfo
      // Ensure we only take the first entry if multiple presences exist for a key
      const users = Object.values(presenceState).map(
        (presences) => presences[0].user_info
      );
      setActiveUsers(users.filter((user) => user));
    };

    channel
      .on("presence", { event: "sync" }, handleSync)
      .on("presence", { event: "join" }, handleSync)
      .on("presence", { event: "leave" }, handleSync)
      .subscribe(async (status: ChannelStatus) => {
        if (status === "SUBSCRIBED") {
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
          handleSync(); // Initial sync
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user, isAuthLoading, supabase]);

  // Don't render trigger if auth is loading or user is not logged in (shouldn't happen for Admin, but safe)
  if (isAuthLoading || !user) {
    return null;
  }

  const count = activeUsers.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors">
          <Users className="h-4 w-4" />
          <span>{count}</span>
          <span className="hidden sm:inline">Online</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Active Users ({count})</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {activeUsers.length > 0 ? (
          <div className="max-h-60 overflow-y-auto p-1">
            {" "}
            {/* Scrollable list */}
            {activeUsers.map((activeUser) => (
              <DropdownMenuItem
                key={activeUser.id}
                className="flex items-center gap-2 cursor-default"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={activeUser?.avatar_url}
                    alt={activeUser?.name}
                  />
                  <AvatarFallback className="text-xs">
                    {activeUser?.name?.charAt(0).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm truncate">{activeUser?.name}</span>
              </DropdownMenuItem>
            ))}
          </div>
        ) : (
          <DropdownMenuItem disabled>No active users</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
