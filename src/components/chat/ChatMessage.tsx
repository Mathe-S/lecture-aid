"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { MessageSquare, ThumbsUp, Heart, Smile, Pin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ChatMessageWithReplies } from "@/types/chat";
import { useToggleReaction, useTogglePin } from "@/hooks/useChat";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageWithReplies;
  onReply: (message: ChatMessageWithReplies) => void;
  highlighted?: boolean;
  isPinned?: boolean;
  showPin?: boolean;
}

const REACTION_ICONS = {
  like: <ThumbsUp className="h-4 w-4" />,
  heart: <Heart className="h-4 w-4" />,
  smile: <Smile className="h-4 w-4" />,
};

export function ChatMessage({
  message,
  onReply,
  highlighted = false,
  isPinned = false,
  showPin = true,
}: ChatMessageProps) {
  const { user } = useAuth();
  const { mutate: toggleReaction } = useToggleReaction();
  const { mutate: togglePin } = useTogglePin();
  const [showReplies, setShowReplies] = useState(false);

  // Check if the current user has reacted with each reaction type
  const hasReacted = (reaction: string) => {
    return message.reactions.some(
      (r) => r.userId === user?.id && r.reaction === reaction
    );
  };

  // Format the timestamp
  const formattedTime = message.createdAt
    ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })
    : "";

  // Handle toggling a reaction
  const handleReaction = (reaction: string) => {
    toggleReaction({
      messageId: message.id,
      reaction,
    });
  };

  // Handle toggling pin status
  const handleTogglePin = () => {
    togglePin({
      messageId: message.id,
      chatRoomId: message.chatRoomId,
    });
  };

  return (
    <Card
      className={cn(
        "mb-4",
        highlighted && "border-primary bg-muted/20",
        isPinned && "border-yellow-500"
      )}
    >
      {isPinned && (
        <div className="bg-yellow-500/20 py-1 px-3 flex items-center text-xs text-yellow-600 dark:text-yellow-400">
          <Pin className="h-3 w-3 mr-1" /> Pinned message
        </div>
      )}

      <CardContent className="pt-4">
        <div className="flex items-start">
          <Avatar className="h-8 w-8 mr-3">
            <AvatarImage
              src={message.author?.avatarUrl || ""}
              alt={message.author?.fullName || "User"}
            />
            <AvatarFallback>
              {message.author?.fullName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-semibold text-sm">
                  {message.author?.fullName || "Anonymous"}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  {formattedTime}
                </span>
                {message.isEdited && (
                  <span className="text-xs text-muted-foreground ml-1">
                    (edited)
                  </span>
                )}
              </div>

              {showPin && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleTogglePin}
                  title={isPinned ? "Unpin message" : "Pin message"}
                >
                  <Pin
                    className={cn("h-4 w-4", isPinned && "text-yellow-500")}
                  />
                </Button>
              )}
            </div>

            {/* If this is a reply, show parent message reference */}
            {message.parentMessage && (
              <div className="text-xs text-muted-foreground mb-1 border-l-2 border-muted-foreground/30 pl-2">
                Replying to {message.parentMessage.author?.fullName}
              </div>
            )}

            <div className="mt-1 text-sm whitespace-pre-wrap">
              {message.content}
            </div>

            {/* Reactions display */}
            {message.reactions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(message.reactionCounts || {}).map(
                  ([reaction, count]) => (
                    <Button
                      key={reaction}
                      variant={hasReacted(reaction) ? "default" : "outline"}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleReaction(reaction)}
                    >
                      {REACTION_ICONS[
                        reaction as keyof typeof REACTION_ICONS
                      ] || reaction}{" "}
                      <span className="ml-1">{count}</span>
                    </Button>
                  )
                )}
              </div>
            )}

            {/* Show replies if any */}
            {message.replies && message.replies.length > 0 && (
              <div className="mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setShowReplies(!showReplies)}
                >
                  {showReplies ? "Hide" : "Show"} {message.replies.length}{" "}
                  {message.replies.length === 1 ? "reply" : "replies"}
                </Button>

                {showReplies && (
                  <div className="mt-2 pl-4 border-l-2 border-muted-foreground/30">
                    {message.replies.map((reply) => (
                      <ChatMessage
                        key={reply.id}
                        message={reply}
                        onReply={onReply}
                        showPin={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-start py-2 px-4 gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => handleReaction("like")}
        >
          <ThumbsUp
            className={cn(
              "h-4 w-4 mr-1",
              hasReacted("like") && "text-primary fill-primary"
            )}
          />
          Like
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => handleReaction("heart")}
        >
          <Heart
            className={cn(
              "h-4 w-4 mr-1",
              hasReacted("heart") && "text-red-500 fill-red-500"
            )}
          />
          Heart
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => handleReaction("smile")}
        >
          <Smile
            className={cn(
              "h-4 w-4 mr-1",
              hasReacted("smile") && "text-yellow-500 fill-yellow-500"
            )}
          />
          Smile
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => onReply(message)}
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          Reply
        </Button>
      </CardFooter>
    </Card>
  );
}
