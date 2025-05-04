import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel, User } from "@supabase/supabase-js";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const HANGOUT_PRESENCE_CHANNEL = "hangout-active-users";

interface HangoutPresenceInfo {
  joined_at: string;
  user_id: string;
}

interface HangoutState {
  count: number | null;
  channel: RealtimeChannel | null;
  currentUser: User | null; // Keep track of the user associated with the channel
  setCount: (count: number | null) => void;
  setChannel: (channel: RealtimeChannel | null) => void;
  setCurrentUser: (user: User | null) => void;
  initializeChannel: (user: User) => void;
  closeChannel: () => Promise<void>;
  trackPresence: () => Promise<void>;
  untrackPresence: () => Promise<void>;
}

const supabase = createClient(); // Create client once

export const useHangoutStore = create<HangoutState>((set, get) => ({
  count: null,
  channel: null,
  currentUser: null,

  setCount: (count) => set({ count }),
  setChannel: (channel) => set({ channel }),
  setCurrentUser: (user) => set({ currentUser: user }),

  initializeChannel: (user) => {
    // Prevent re-initialization for the same user or if channel already exists
    if (get().channel || get().currentUser?.id === user.id) {
      console.log(
        "[Hangout Store] Channel already initialized or initializing for same user."
      );
      // Optionally re-sync if channel exists but user changed? Maybe not necessary.
      return;
    }

    get().setCurrentUser(user); // Set the user for this channel instance

    const newChannel = supabase.channel(HANGOUT_PRESENCE_CHANNEL, {
      config: {
        presence: {
          key: user.id, // Use user ID as presence key
        },
      },
    });

    const handleSync = () => {
      if (!newChannel) return;
      try {
        const presenceState = newChannel.presenceState<HangoutPresenceInfo>();
        const newCount = Object.keys(presenceState).length;
        get().setCount(newCount);
      } catch (error) {
        console.error("[Hangout Store] Error during presence sync:", error);
      }
    };

    newChannel
      .on("presence", { event: "sync" }, handleSync)
      .on("presence", { event: "join" }, handleSync)
      .on("presence", { event: "leave" }, handleSync)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          get().setChannel(newChannel); // Set channel in state *after* successful subscribe
          handleSync(); // Initial sync
        } else if (
          status === "CLOSED" ||
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT"
        ) {
          console.warn(
            "[Hangout Store] Channel closed or timed out. Cleaning up."
          );
          // Don't call closeChannel here to avoid infinite loops if subscribe fails repeatedly
          get().setChannel(null);
          get().setCount(null);
          get().setCurrentUser(null); // Clear user association on closure
        }
      });
  },

  closeChannel: async () => {
    const currentChannel = get().channel;
    if (currentChannel) {
      try {
        await currentChannel.unsubscribe();
        console.log("[Hangout Store] Unsubscribe successful.");
      } catch (error) {
        console.error("[Hangout Store] Error unsubscribing:", error);
      } finally {
        get().setChannel(null);
        get().setCount(null);
        get().setCurrentUser(null); // Clear user on explicit close
      }
    } else {
      console.log("[Hangout Store] No active channel to close.");
      // Ensure state is clean even if channel was null
      get().setChannel(null);
      get().setCount(null);
      get().setCurrentUser(null);
    }
  },

  trackPresence: async () => {
    const { channel, currentUser } = get();
    if (!channel || !currentUser) {
      console.warn(
        "[Hangout Store] Cannot track presence: Channel or User not available."
      );
      return;
    }
    try {
      await channel.track({
        joined_at: new Date().toISOString(),
        user_id: currentUser.id,
      });
      console.log(`[Hangout Store] Tracking successful.`);
    } catch (error) {
      console.error(`[Hangout Store] Error tracking presence:`, error);
    }
  },

  untrackPresence: async () => {
    const { channel, currentUser } = get();
    // It's okay to untrack even if currentUser is briefly null during logout,
    // as untrack doesn't require specific user data, just the channel instance.
    if (!channel) {
      console.warn(
        "[Hangout Store] Cannot untrack presence: Channel not available."
      );
      return;
    }
    try {
      // untrack() removes the presence tracked by this specific channel instance
      await channel.untrack();
      console.log(`[Hangout Store] Untracking successful.`);
    } catch (error) {
      console.error(`[Hangout Store] Error untracking presence:`, error);
    }
  },
}));

// Optional: Hook to manage initialization/cleanup based on auth state
// This should be used in a component that has access to useAuth, like Layout or Navbar
export function useInitializeHangoutStore() {
  const { user, isLoading } = useAuth();
  const initializeChannel = useHangoutStore((state) => state.initializeChannel);
  const closeChannel = useHangoutStore((state) => state.closeChannel);
  const storeUser = useHangoutStore((state) => state.currentUser);

  useEffect(() => {
    if (!isLoading && user && user.id !== storeUser?.id) {
      // User logged in or changed, and store doesn't match
      console.log(
        "[Auth Listener] Initializing hangout store for user:",
        user.id
      );
      initializeChannel(user);
    } else if (!isLoading && !user && storeUser) {
      // User logged out, but store still has a channel/user
      console.log(
        "[Auth Listener] Closing hangout store channel due to logout."
      );
      closeChannel();
    }

    // Cleanup on component unmount *if* needed (e.g., if this hook isn't in a persistent layout)
    // return () => {
    //     console.log('[Auth Listener] Unmounting - Closing hangout store channel.');
    //     closeChannel();
    // };

    // Depend on user object reference and loading state
  }, [user, isLoading, initializeChannel, closeChannel, storeUser]);
}
