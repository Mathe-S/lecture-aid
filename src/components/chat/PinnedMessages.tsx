"use client";

import { usePinnedMessages } from "@/hooks/useChat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pin, X } from "lucide-react";
import { useTogglePin } from "@/hooks/useChat";
import { formatDistanceToNow } from "date-fns";

interface PinnedMessagesProps {
  chatRoomId: string;
  onMessageClick: (messageId: string) => void;
}

export function PinnedMessages({
  chatRoomId,
  onMessageClick,
}: PinnedMessagesProps) {
  const { data: pinnedMessages, isLoading } = usePinnedMessages(chatRoomId);
  const { mutate: togglePin } = useTogglePin();

  const handleUnpin = (messageId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the message click
    togglePin({
      messageId,
      chatRoomId,
    });
  };

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardContent className="p-3">
          <div className="text-sm text-muted-foreground text-center">
            Loading pinned messages...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pinnedMessages || pinnedMessages.length === 0) {
    return (
      <Card className="mb-4">
        <CardContent className="p-3">
          <div className="text-sm text-muted-foreground text-center">
            No pinned messages
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardContent className="pt-3">
        <div className="flex items-center mb-2">
          <Pin className="h-4 w-4 mr-2 text-yellow-500" />
          <h3 className="text-sm font-medium">Pinned Messages</h3>
        </div>
        <div className="space-y-2">
          {pinnedMessages.map((pinned) => (
            <div
              key={pinned.id}
              className="flex items-start p-2 rounded-md bg-muted/30 hover:bg-muted cursor-pointer"
              onClick={() => onMessageClick(pinned.message.id)}
            >
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage
                  src={pinned.message.author?.avatarUrl || ""}
                  alt={pinned.message.author?.fullName || "User"}
                />
                <AvatarFallback>
                  {pinned.message.author?.fullName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-xs">
                    {pinned.message.author?.fullName || "Anonymous"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {pinned.message.createdAt
                      ? formatDistanceToNow(
                          new Date(pinned.message.createdAt),
                          { addSuffix: true }
                        )
                      : ""}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {pinned.message.content}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 ml-2"
                onClick={(e) => handleUnpin(pinned.message.id, e)}
                title="Unpin message"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
