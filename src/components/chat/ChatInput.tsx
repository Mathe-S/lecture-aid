"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/textarea";
import { Send, X } from "lucide-react";
import { useSendMessage } from "@/hooks/useChat";
import { ChatMessageWithReplies } from "@/types/chat";

interface ChatInputProps {
  chatRoomId: string;
  replyTo?: ChatMessageWithReplies | null;
  onCancelReply: () => void;
}

export function ChatInput({
  chatRoomId,
  replyTo = null,
  onCancelReply,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { mutate: sendMessage, isPending } = useSendMessage();

  // Focus the input when the component mounts or when replying to a message
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyTo]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    sendMessage(
      {
        chatRoomId,
        content: message.trim(),
        parentMessageId: replyTo?.id,
      },
      {
        onSuccess: () => {
          setMessage("");
          if (replyTo) {
            onCancelReply();
          }
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send message on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="p-4 border-t bg-card">
      {replyTo && (
        <div className="mb-2 flex items-center text-sm text-muted-foreground bg-muted/30 p-2 rounded">
          <span className="flex-1">
            Replying to{" "}
            <span className="font-medium">{replyTo.author?.fullName}</span>:{" "}
            <span className="italic">
              {replyTo.content.length > 60
                ? `${replyTo.content.substring(0, 60)}...`
                : replyTo.content}
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onCancelReply}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Textarea
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={replyTo ? "Write your reply..." : "Type your message..."}
          className="min-h-24 resize-none"
        />

        <Button
          className="self-end"
          disabled={isPending || !message.trim()}
          onClick={handleSendMessage}
        >
          <Send className="h-4 w-4 mr-2" />
          Send
        </Button>
      </div>

      <div className="text-xs text-muted-foreground mt-2">
        Press Ctrl+Enter to send
      </div>
    </div>
  );
}
