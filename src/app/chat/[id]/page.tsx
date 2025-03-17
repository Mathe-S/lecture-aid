"use client";

import { useParams } from "next/navigation";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { ChatRoomsList } from "@/components/chat/ChatRoomsList";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { useQuery } from "@tanstack/react-query";

export default function ChatPage() {
  const params = useParams();
  const chatRoomId = params?.id as string;

  // Set up real-time subscriptions
  useRealtimeMessages(chatRoomId);

  // Fetch chat room details
  const { data: chatRoom } = useQuery({
    queryKey: ["chatRoom", chatRoomId],
    queryFn: async () => {
      if (!chatRoomId) return null;
      const response = await fetch(`/api/chat/rooms/${chatRoomId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch chat room");
      }
      const data = await response.json();
      return data.chatRoom;
    },
    enabled: !!chatRoomId,
  });

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar with chat rooms list */}
        <div className="col-span-12 lg:col-span-3">
          <ChatRoomsList selectedRoomId={chatRoomId} />
        </div>

        {/* Main chat area */}
        <div className="col-span-12 lg:col-span-9">
          {chatRoomId ? (
            <ChatRoom
              chatRoomId={chatRoomId}
              chatRoomName={chatRoom?.name || "Chat"}
            />
          ) : (
            <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
              <p className="text-muted-foreground">
                Select a chat room to start messaging
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
