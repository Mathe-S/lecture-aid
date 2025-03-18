"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquare, Search } from "lucide-react";
import { ChatRoom } from "@/types/chat";
import { CreateChatRoomModal } from "@/components/chat/CreateChatRoomModal";

interface ChatRoomsListProps {
  selectedRoomId?: string;
}

export function ChatRoomsList({ selectedRoomId }: ChatRoomsListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  // This would fetch chat rooms from your API
  const { data: chatRooms, isLoading } = useQuery({
    queryKey: ["chatRooms"],
    queryFn: async () => {
      const response = await fetch("/api/chat/rooms");
      if (!response.ok) {
        throw new Error("Failed to fetch chat rooms");
      }
      const data = await response.json();
      return data.chatRooms;
    },
  });

  const filteredRooms = chatRooms
    ? chatRooms.filter((room: ChatRoom) =>
        room.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Chat Rooms
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chat rooms..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="mt-2">
          <CreateChatRoomModal />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center items-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredRooms.length > 0 ? (
          <div className="divide-y">
            {filteredRooms.map((room: ChatRoom) => (
              <Button
                key={room.id}
                variant="ghost"
                className={`w-full justify-start rounded-none p-3 ${
                  selectedRoomId === room.id ? "bg-muted" : ""
                }`}
                onClick={() => router.push(`/chat/${room.id}`)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                <span className="truncate">{room.name}</span>
              </Button>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            {searchTerm
              ? "No chat rooms matching your search"
              : "No chat rooms available"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
