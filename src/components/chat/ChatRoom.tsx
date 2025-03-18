"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useChatMessages } from "@/hooks/useChat";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { PinnedMessages } from "@/components/chat/PinnedMessages";
import { ChatMessageWithReplies } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ChatRoomProps {
  chatRoomId: string;
  chatRoomName?: string;
}

export function ChatRoom({ chatRoomId, chatRoomName = "Chat" }: ChatRoomProps) {
  const { user } = useAuth();
  const {
    data: messages,
    isLoading,
    isError,
    refetch,
  } = useChatMessages(chatRoomId);
  const [replyTo, setReplyTo] = useState<ChatMessageWithReplies | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);
  const messageListRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom when new messages arrive
  useEffect(() => {
    if (messages && messageListRef.current) {
      const { scrollHeight, clientHeight } = messageListRef.current;
      messageListRef.current.scrollTop = scrollHeight - clientHeight;
    }
  }, [messages]);

  // Scroll to highlighted message
  useEffect(() => {
    if (highlightedMessageId && messageListRef.current) {
      const highlightedElement = document.getElementById(
        `message-${highlightedMessageId}`
      );
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [highlightedMessageId]);

  const handleReply = (message: ChatMessageWithReplies) => {
    setReplyTo(message);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  const handlePinnedMessageClick = (messageId: string) => {
    setHighlightedMessageId(messageId);

    // Clear the highlight after 3 seconds
    setTimeout(() => {
      setHighlightedMessageId(null);
    }, 3000);
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>Please sign in to access chat.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[calc(100vh-12rem)]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          {chatRoomName}
        </CardTitle>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 overflow-hidden p-0">
        {/* Pinned messages section */}
        <div className="p-3">
          <PinnedMessages
            chatRoomId={chatRoomId}
            onMessageClick={handlePinnedMessageClick}
          />
        </div>

        <Separator />

        {/* Messages list */}
        <div
          ref={messageListRef}
          className="flex-1 overflow-y-auto p-3"
          style={{ maxHeight: "calc(100% - 80px)" }}
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="flex flex-col justify-center items-center h-full">
              <p className="text-muted-foreground mb-2">
                Failed to load messages
              </p>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try again
              </Button>
            </div>
          ) : messages && messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} id={`message-${message.id}`}>
                  <ChatMessage
                    message={message}
                    onReply={handleReply}
                    highlighted={message.id === highlightedMessageId}
                    isPinned={false} // This would need to be determined dynamically
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">
                No messages yet. Be the first to send one!
              </p>
            </div>
          )}
        </div>
      </CardContent>

      {/* Message input */}
      <ChatInput
        chatRoomId={chatRoomId}
        replyTo={replyTo}
        onCancelReply={handleCancelReply}
      />
    </Card>
  );
}
