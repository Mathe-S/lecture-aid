"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ChatRoomsList } from "@/components/chat/ChatRoomsList";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function ChatPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Fetch all chat rooms
  const { data: chatRooms, isLoading: roomsLoading } = useQuery({
    queryKey: ["chatRooms"],
    queryFn: async () => {
      const response = await fetch("/api/chat/rooms");
      if (!response.ok) {
        throw new Error("Failed to fetch chat rooms");
      }
      const data = await response.json();
      return data.chatRooms;
    },
    enabled: !!user,
  });

  // Redirect to the first chat room if available
  useEffect(() => {
    if (chatRooms && chatRooms.length > 0 && !authLoading) {
      router.push(`/chat/${chatRooms[0].id}`);
    }
  }, [chatRooms, router, authLoading]);

  if (authLoading || roomsLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Please sign in to access chat.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar with chat rooms list */}
        <div className="col-span-12 lg:col-span-3">
          <ChatRoomsList />
        </div>

        {/* Welcome message if no chat is selected */}
        <div className="col-span-12 lg:col-span-9">
          <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
            <p className="text-muted-foreground">
              {chatRooms && chatRooms.length > 0
                ? "Select a chat room to start messaging"
                : "No chat rooms available. Create one to get started."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
